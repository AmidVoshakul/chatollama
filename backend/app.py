# backend/app.py
import os
import re
import subprocess
import threading
import time
import shutil
import logging
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlmodel import SQLModel, Session, create_engine, select, delete
import httpx

from models import Chat, Message
from schemas import ChatCreate, ChatRead, MessageCreate, MessageRead
from model_descriptions import MODEL_DESCRIPTIONS

# ---- basic logging ----
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")

DATABASE_URL = "sqlite:///database.db"
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_CMD = os.getenv("OLLAMA_CMD", "ollama")  # allow override in env

engine = create_engine(DATABASE_URL, echo=False)
SQLModel.metadata.create_all(engine)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# Helper to run a command safely and return stdout (raises HTTPException on failure)
def run_cmd(cmd: List[str], timeout: int = 30) -> str:
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired as e:
        logger.error("Command timeout: %s", " ".join(cmd))
        raise HTTPException(status_code=504, detail=f"Command timeout: {' '.join(cmd)}")
    except Exception as e:
        logger.exception("Command execution error")
        raise HTTPException(status_code=500, detail=f"Command execution error: {e}")

    if proc.returncode != 0:
        stderr = proc.stderr.strip() or proc.stdout.strip() or "Unknown error"
        logger.error("Command failed (%s): %s", " ".join(cmd), stderr)
        raise HTTPException(status_code=502, detail=f"Command failed: {stderr}")

    return proc.stdout or ""


def parse_ollama_show_output(output: str) -> dict:
    info = {}
    license_lines = []
    for raw in output.splitlines():
        line = raw.strip()
        if not line:
            continue
        m = re.match(r'Last modified:\s*(.+)$', line, flags=re.IGNORECASE)
        if m:
            info["last_modified"] = m.group(1).strip()
            continue
        kv = re.split(r'\s{2,}', line)
        if len(kv) >= 2:
            key = kv[0].lower().strip()
            val = kv[1].strip()
            if "architecture" in key:
                info["architecture"] = val
                continue
            if "parameter" in key:
                info["parameters"] = val
                continue
            if "context" in key:
                info["context_length"] = val
                continue
            if "embedding" in key:
                info["embedding_length"] = val
                continue
            if "quantization" in key:
                info["quantization"] = val
                continue
            if "license" in key or "terms" in key or "gemma" in val.lower():
                license_lines.append(val)
                continue
        if re.search(r'license|terms|use', line, flags=re.IGNORECASE):
            license_lines.append(line)
    if license_lines:
        info["license"] = " | ".join(license_lines)
    return info


download_progress_map = {}  # { "model:variant": {percent, downloaded, total, speed} }


def ollama_pull_with_progress(model_ref):
    global download_progress_map
    download_progress_map[model_ref] = {"percent": 0, "downloaded": "", "total": "", "speed": ""}
    cmd = [OLLAMA_CMD, "pull", model_ref]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    for line in proc.stdout:
        m = re.search(r'(\d{1,3})%\s+([\d\.]+[KMG]B)/([\d\.]+[KMG]B)\s+([\d\.]+[KMG]B/s)', line)
        if m:
            percent = int(m.group(1))
            downloaded = m.group(2)
            total = m.group(3)
            speed = m.group(4)
            download_progress_map[model_ref] = {
                "percent": percent,
                "downloaded": downloaded,
                "total": total,
                "speed": speed
            }
    proc.wait()
    download_progress_map[model_ref]["percent"] = 100
    time.sleep(5)
    download_progress_map.pop(model_ref, None)


# ========== MODELS endpoints ==========

@app.get("/api/models", response_model=List[str])
def list_installed_models():
    try:
        out = run_cmd([OLLAMA_CMD, "list"], timeout=10)
        lines = [ln for ln in out.splitlines() if ln.strip()]
        parsed = []
        for line in lines[1:] if len(lines) > 1 else lines:
            parts = re.split(r'\s{2,}', line.strip())
            if parts:
                parsed.append(parts[0])
        return parsed
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.exception("Error listing models")
        raise HTTPException(status_code=502, detail=f"Ошибка `ollama list`: {e}")


@app.get("/api/models/available", response_model=List[str])
def list_available_models():
    try:
        out = run_cmd([OLLAMA_CMD, "list", "--all"], timeout=15)
        lines = [ln for ln in out.splitlines() if ln.strip()]
        parsed = []
        for line in lines[1:] if len(lines) > 1 else lines:
            parts = re.split(r'\s{2,}', line.strip())
            if parts:
                parsed.append(parts[0])
        return parsed
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.exception("Error listing available models")
        raise HTTPException(status_code=502, detail=f"Ошибка получения доступных моделей: {e}")


@app.post("/api/models/download")
def download_model(body: dict = Body(...)):
    name = body.get("name")
    variant = body.get("variant")
    ref = body.get("ref")

    if ref:
        if ":" not in ref:
            raise HTTPException(status_code=400, detail="ref must be in format name:variant")
        name, variant = ref.split(":", 1)

    if not name or not variant:
        raise HTTPException(status_code=400, detail="name and variant required (or ref)")

    model_ref = f"{name}:{variant}"
    threading.Thread(target=ollama_pull_with_progress, args=(model_ref,), daemon=True).start()
    logger.info("Started background model download: %s", model_ref)
    return {"status": "started", "ref": model_ref}


@app.delete("/api/models/{ref}")
def delete_model(ref: str):
    model_ref = ref
    try:
        _ = run_cmd([OLLAMA_CMD, "rm", model_ref], timeout=120)
        return {"status": "ok", "message": f"Модель '{model_ref}' удалена"}
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.exception("Error deleting model")
        raise HTTPException(status_code=500, detail=f"Ошибка удаления модели: {e}")


@app.get("/api/models/info/{name}")
def get_model_info(name: str, variant: Optional[str] = Query(None, description="variant like 2B")):
    if variant:
        model_ref = f"{name}:{variant}"
        try:
            out = run_cmd([OLLAMA_CMD, "show", model_ref], timeout=15)
            info = parse_ollama_show_output(out)
            if not info:
                info = MODEL_DESCRIPTIONS.get(name) or {}
            return info
        except HTTPException as e:
            if e.status_code == 502:
                raise HTTPException(status_code=502, detail=f"Ошибка `ollama show`: {e.detail}")
            raise e
        except Exception as e:
            logger.exception("Error in get_model_info")
            raise HTTPException(status_code=500, detail=f"Ошибка получения информации о модели: {e}")
    info = MODEL_DESCRIPTIONS.get(name)
    if info:
        return info
    try:
        installed_list = run_cmd([OLLAMA_CMD, "list"], timeout=10).splitlines()
        candidates = []
        for line in installed_list[1:] if len(installed_list) > 1 else installed_list:
            text = line.strip()
            if not text:
                continue
            col = re.split(r'\s{2,}', text)[0]
            if col.startswith(f"{name}:"):
                candidates.append(col)
        if candidates:
            model_ref = candidates[0]
            out = run_cmd([OLLAMA_CMD, "show", model_ref], timeout=15)
            return parse_ollama_show_output(out)
    except HTTPException:
        pass
    except Exception:
        pass

    raise HTTPException(status_code=404, detail="Информация о модели не найдена")


@app.get("/api/models/progress")
def get_download_progress(name: str, variant: str):
    model_ref = f"{name}:{variant}"
    progress = download_progress_map.get(model_ref, {"percent": 0})
    return progress


@app.post("/api/models/cancel")
def cancel_download(body: dict = Body(...)):
    return {"status": "cancelled"}


# ========== CHATS ==========

@app.post("/api/chats", response_model=ChatRead, status_code=201)
def create_chat(data: ChatCreate):
    with Session(engine) as session:
        chat = Chat(title=data.title)
        session.add(chat)
        session.commit()
        session.refresh(chat)
        return chat


@app.get("/api/chats", response_model=List[ChatRead])
def list_chats():
    with Session(engine) as session:
        return session.exec(select(Chat)).all()


@app.delete("/api/chats/{chat_id}", status_code=204)
def delete_chat(chat_id: int):
    with Session(engine) as session:
        chat = session.get(Chat, chat_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        session.exec(delete(Message).where(Message.chat_id == chat_id))
        session.delete(chat)
        session.commit()


# ========== MESSAGES ==========

@app.get("/api/chats/{chat_id}/messages", response_model=List[MessageRead])
def get_messages(chat_id: int):
    with Session(engine) as session:
        if not session.get(Chat, chat_id):
            raise HTTPException(status_code=404, detail="Chat not found")
        return session.exec(select(Message).where(Message.chat_id == chat_id).order_by(Message.created_at)).all()


def call_ollama_sync(model: str, prompt: str, timeout: int = 120) -> str:
    """
    Synchronous non-streaming call to Ollama generate endpoint.
    Returns final response text (string). Raises HTTPException on error or empty response.
    """
    url = f"{OLLAMA_HOST}/api/generate"
    payload = {"model": model, "prompt": prompt, "stream": False}
    headers = {"Accept": "application/json", "Content-Type": "application/json"}
    try:
        resp = httpx.post(url, json=payload, headers=headers, timeout=None)
    except httpx.RequestError as e:
        logger.exception("HTTP request to Ollama failed")
        raise HTTPException(status_code=502, detail=f"Connection to model failed: {e}")
    if resp.status_code != 200:
        logger.error("Ollama generate returned %s: %s", resp.status_code, resp.text)
        raise HTTPException(status_code=502, detail=f"Model returned status {resp.status_code}: {resp.text}")
    try:
        j = resp.json()
    except Exception as e:
        logger.exception("Invalid JSON from Ollama")
        raise HTTPException(status_code=502, detail=f"Invalid JSON from model: {e}")

    # Ollama responses may have various shapes; try common keys
    text = ""
    if isinstance(j, dict):
        # common fields: response, text, output
        text = j.get("response") or j.get("text") or j.get("output") or ""
        # some implementations embed nested structure
        if not text:
            # try to extract from choices / generated text fields
            if "choices" in j and isinstance(j["choices"], list) and j["choices"]:
                c0 = j["choices"][0]
                text = c0.get("text") or c0.get("response") or c0.get("message") or ""
    if not isinstance(text, str):
        text = str(text)

    final = text.strip()
    if not final:
        logger.error("Ollama returned empty response JSON: %s", j)
        raise HTTPException(status_code=500, detail="Model returned empty response")
    return final


@app.post("/api/chats/{chat_id}/messages", response_model=MessageRead)
def send_message(chat_id: int, msg: MessageCreate):
    # Validate chat exists and insert user message
    with Session(engine) as session:
        if not session.get(Chat, chat_id):
            raise HTTPException(status_code=404, detail="Chat not found")
        user_msg = Message(chat_id=chat_id, role=msg.role, content=msg.content, model=msg.model)
        session.add(user_msg)
        session.commit()
        session.refresh(user_msg)
        logger.info("Inserted user message id=%s", user_msg.id)

    # Build history including new user message
    with Session(engine) as session:
        history = session.exec(select(Message).where(Message.chat_id == chat_id).order_by(Message.created_at)).all()
    prompt = "\n".join(f"{m.role}: {m.content}" for m in history)
    logger.info("Calling model for chat %s (prompt len=%d)", chat_id, len(prompt))

    # Call model synchronously
    final_text = call_ollama_sync(msg.model, prompt, timeout=180)

    # Save assistant message (append)
    with Session(engine) as session:
        bot_msg = Message(chat_id=chat_id, role="assistant", content=final_text, model=msg.model)
        session.add(bot_msg)
        session.commit()
        session.refresh(bot_msg)
        logger.info("Saved assistant message id=%s for chat=%s", bot_msg.id, chat_id)
        return bot_msg


@app.post("/api/chats/{chat_id}/messages/stream")
def send_message_stream(chat_id: int, msg: MessageCreate):
    """
    Streaming endpoint - sends user message, then streams assistant response via SSE.
    """
    async def event_generator():
        with Session(engine) as session:
            if not session.get(Chat, chat_id):
                yield "data: error:Chat not found\n\n"
                return

            user_msg = Message(chat_id=chat_id, role=msg.role, content=msg.content, model=msg.model)
            session.add(user_msg)
            session.commit()
            session.refresh(user_msg)
            logger.info("Inserted user message id=%s (streaming)", user_msg.id)

        with Session(engine) as session:
            history = session.exec(select(Message).where(Message.chat_id == chat_id).order_by(Message.created_at)).all()
        prompt = "\n".join(f"{m.role}: {m.content}" for m in history)
        logger.info("Calling model for chat %s (streaming, prompt len=%d)", chat_id, len(prompt))

        url = f"{OLLAMA_HOST}/api/generate"
        payload = {"model": msg.model, "prompt": prompt, "stream": True}
        headers = {"Accept": "application/x-ndjson", "Content-Type": "application/json"}

        full_response = ""
        assistant_id = None

        try:
            import httpx
            import json
            with httpx.stream("POST", url, json=payload, headers=headers, timeout=180.0) as response:
                if response.status_code != 200:
                    error_msg = f"Model error: {response.status_code}"
                    yield f"data: error:{error_msg}\n\n"
                    return

                for line in response.iter_lines():
                    if not line:
                        continue
                    try:
                        data = json.loads(line)
                        if data.get("done"):
                            break
                        token = data.get("response", "")
                        if token:
                            full_response += token
                            yield f"data: chunk:{token}\n\n"
                    except json.JSONDecodeError:
                        continue
        except Exception as e:
            logger.exception("Streaming error")
            yield f"data: error:{str(e)}\n\n"
            return

        with Session(engine) as session:
            bot_msg = Message(chat_id=chat_id, role="assistant", content=full_response, model=msg.model)
            session.add(bot_msg)
            session.commit()
            session.refresh(bot_msg)
            assistant_id = bot_msg.id
            logger.info("Saved assistant message id=%s for chat=%s (streaming)", bot_msg.id, chat_id)

        yield f"data: done:{assistant_id}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.post("/api/chats/{chat_id}/stop", status_code=200)
def stop_generation(chat_id: int):
    # Not implemented: proper stop/cancel of in-flight model calls
    return {"status": "not implemented in this server endpoint"}


@app.delete("/api/messages/{message_id}", status_code=204)
def delete_message(message_id: int):
    with Session(engine) as session:
        msg = session.get(Message, message_id)
        if not msg:
            raise HTTPException(status_code=404, detail="Message not found")
        session.delete(msg)
        session.commit()


@app.put("/api/messages/{message_id}", response_model=MessageRead)
def edit_message(message_id: int, data: dict):
    with Session(engine) as session:
        msg = session.get(Message, message_id)
        if not msg:
            raise HTTPException(status_code=404, detail="Message not found")
        msg.content = data.get("content", msg.content)
        session.add(msg)
        session.commit()
        session.refresh(msg)
        logger.info("Edited message id=%s", msg.id)
        return msg


@app.post("/api/messages/{message_id}/regenerate", response_model=MessageRead)
def regenerate_message(message_id: int, data: dict = Body(default={})):
    # Locate existing assistant message
    with Session(engine) as session:
        msg = session.get(Message, message_id)
        if not msg or msg.role != "assistant":
            raise HTTPException(status_code=404, detail="Message not found or not assistant")
        # Build prompt using history (include user + assistant context)
        history = session.exec(select(Message).where(Message.chat_id == msg.chat_id).order_by(Message.created_at)).all()
        prompt = "\n".join(f"{m.role}: {m.content}" for m in history if m.role in ("user", "assistant"))
        model = data.get("model", msg.model)
    logger.info("Regenerating message id=%s using model=%s", message_id, model)

    # Call model synchronously
    final_text = call_ollama_sync(model, prompt, timeout=180)

    # Update existing assistant message in-place
    with Session(engine) as session:
        existing = session.get(Message, message_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Message disappeared")
        existing.content = final_text
        existing.model = model
        session.add(existing)
        session.commit()
        session.refresh(existing)
    logger.info("Regenerated and updated message id=%s", existing.id)
    return existing


@app.post("/api/messages/{message_id}/regenerate/stream")
def regenerate_message_stream(message_id: int, body: dict = Body(default={})):
    """
    Streaming regenerate endpoint - updates message in place with streaming response.
    """
    async def event_generator():
        with Session(engine) as session:
            msg = session.get(Message, message_id)
            if not msg or msg.role != "assistant":
                yield "data: error:Message not found or not assistant\n\n"
                return
            chat_id = msg.chat_id
            history = session.exec(select(Message).where(Message.chat_id == chat_id).order_by(Message.created_at)).all()
            prompt = "\n".join(f"{m.role}: {m.content}" for m in history if m.role in ("user", "assistant"))
            model = body.get("model", msg.model)

        logger.info("Regenerating message id=%s (streaming) using model=%s", message_id, model)

        url = f"{OLLAMA_HOST}/api/generate"
        payload = {"model": model, "prompt": prompt, "stream": True}
        headers = {"Accept": "application/x-ndjson", "Content-Type": "application/json"}

        full_response = ""

        try:
            import httpx
            import json
            with httpx.stream("POST", url, json=payload, headers=headers, timeout=180.0) as response:
                if response.status_code != 200:
                    error_msg = f"Model error: {response.status_code}"
                    yield f"data: error:{error_msg}\n\n"
                    return

                for line in response.iter_lines():
                    if not line:
                        continue
                    try:
                        data = json.loads(line)
                        if data.get("done"):
                            break
                        token = data.get("response", "")
                        if token:
                            full_response += token
                            yield f"data: chunk:{token}\n\n"
                    except json.JSONDecodeError:
                        continue
        except Exception as e:
            logger.exception("Streaming regenerate error")
            yield f"data: error:{str(e)}\n\n"
            return

        with Session(engine) as session:
            existing = session.get(Message, message_id)
            if not existing:
                yield "data: error:Message disappeared\n\n"
                return
            existing.content = full_response
            existing.model = model
            session.add(existing)
            session.commit()
            session.refresh(existing)
            logger.info("Regenerated and updated message id=%s (streaming)", existing.id)

        yield f"data: done:{message_id}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.get("/api/system/disk")
def get_system_disk():
    try:
        usage = shutil.disk_usage("/")
        return {
            "totalBytes": usage.total,
            "usedBytes": usage.used,
            "freeBytes": usage.free,
        }
    except Exception as e:
        logger.exception("Cannot get disk info")
        raise HTTPException(status_code=500, detail=f"Cannot get disk info: {e}")


@app.post("/api/chats/{chat_id}/generate")
def generate_response(chat_id: int, body: dict = Body(...)):
    """
    Generate assistant response without creating a new user message.
    Used after editing a user message.
    """
    model = body.get("model")
    prompt = body.get("prompt", "")
    
    with Session(engine) as session:
        if not session.get(Chat, chat_id):
            raise HTTPException(status_code=404, detail="Chat not found")
    
    url = f"{OLLAMA_HOST}/api/generate"
    payload = {"model": model, "prompt": prompt, "stream": False}
    headers = {"Accept": "application/json", "Content-Type": "application/json"}
    
    try:
        resp = httpx.post(url, json=payload, headers=headers, timeout=180)
    except httpx.RequestError as e:
        logger.exception("HTTP request to Ollama failed")
        raise HTTPException(status_code=502, detail=f"Connection to model failed: {e}")
    
    if resp.status_code != 200:
        logger.error("Ollama generate returned %s: %s", resp.status_code, resp.text)
        raise HTTPException(status_code=502, detail=f"Model returned status {resp.status_code}")
    
    try:
        j = resp.json()
    except Exception as e:
        logger.exception("Invalid JSON from Ollama")
        raise HTTPException(status_code=502, detail=f"Invalid JSON from model: {e}")
    
    text = ""
    if isinstance(j, dict):
        text = j.get("response") or j.get("text") or j.get("output") or ""
        if not text and "choices" in j and isinstance(j["choices"], list) and j["choices"]:
            c0 = j["choices"][0]
            text = c0.get("text") or c0.get("response") or c0.get("message") or ""
    
    if not isinstance(text, str):
        text = str(text)
    
    final = text.strip()
    if not final:
        raise HTTPException(status_code=500, detail="Model returned empty response")
    
    with Session(engine) as session:
        bot_msg = Message(chat_id=chat_id, role="assistant", content=final, model=model)
        session.add(bot_msg)
        session.commit()
        session.refresh(bot_msg)
        logger.info("Saved assistant message id=%s for chat=%s (generate)", bot_msg.id, chat_id)
        return {"id": bot_msg.id, "content": bot_msg.content, "model": bot_msg.model, "created_at": bot_msg.created_at.isoformat()}
