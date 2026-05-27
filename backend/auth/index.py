import json
import os
import hashlib
import secrets
import psycopg

SCHEMA = "t_p46767792_registration_website"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
    "Content-Type": "application/json",
}


def resp(status, data):
    return {"statusCode": status, "headers": CORS, "body": json.dumps(data, ensure_ascii=False)}


def get_conn():
    return psycopg.connect(
        os.environ["DATABASE_URL"],
        prepare_threshold=None,
        cursor_factory=psycopg.ClientCursor,
    )


def q(conn, sql, params=None):
    with conn.cursor() as cur:
        if params:
            final_sql = cur.mogrify(sql, params)
            cur.execute(final_sql)
        else:
            cur.execute(sql)
        try:
            return cur.fetchall()
        except Exception:
            return []


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def handler(event: dict, context) -> dict:
    """Авторизация: register, login, logout, me. action передаётся в query: ?action=..."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "")
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    session_id = (event.get("headers") or {}).get("X-Session-Id", "")

    # register
    if action == "register" and method == "POST":
        nickname = (body.get("nickname") or "").strip()
        email = (body.get("email") or "").strip().lower()
        password = body.get("password") or ""
        car = (body.get("car") or "").strip()

        if not nickname or not email or not password:
            return resp(400, {"error": "Заполните все обязательные поля"})
        if len(password) < 6:
            return resp(400, {"error": "Пароль должен быть не менее 6 символов"})

        with get_conn() as conn:
            rows = q(conn, f"SELECT id FROM {SCHEMA}.users WHERE email = %s OR nickname = %s", [email, nickname])
            if rows:
                return resp(409, {"error": "Пользователь с таким email или никнеймом уже существует"})

            pw_hash = hash_password(password)
            rows = q(conn, f"INSERT INTO {SCHEMA}.users (nickname, email, password_hash, car) VALUES (%s, %s, %s, %s) RETURNING id", [nickname, email, pw_hash, car])
            user_id = rows[0][0]
            sid = secrets.token_hex(32)
            q(conn, f"INSERT INTO {SCHEMA}.sessions (id, user_id) VALUES (%s, %s)", [sid, user_id])
            conn.commit()

        return resp(200, {"session_id": sid, "user": {"id": user_id, "nickname": nickname, "email": email, "car": car}})

    # login
    if action == "login" and method == "POST":
        email = (body.get("email") or "").strip().lower()
        password = body.get("password") or ""

        if not email or not password:
            return resp(400, {"error": "Введите email и пароль"})

        pw_hash = hash_password(password)
        with get_conn() as conn:
            rows = q(conn, f"SELECT id, nickname, email, car FROM {SCHEMA}.users WHERE email = %s AND password_hash = %s", [email, pw_hash])
            if not rows:
                return resp(401, {"error": "Неверный email или пароль"})

            user_id, nickname, u_email, car = rows[0]
            sid = secrets.token_hex(32)
            q(conn, f"INSERT INTO {SCHEMA}.sessions (id, user_id) VALUES (%s, %s)", [sid, user_id])
            conn.commit()

        return resp(200, {"session_id": sid, "user": {"id": user_id, "nickname": nickname, "email": u_email, "car": car}})

    # me
    if action == "me" and method == "GET":
        if not session_id:
            return resp(401, {"error": "Не авторизован"})

        with get_conn() as conn:
            rows = q(conn, f"SELECT u.id, u.nickname, u.email, u.car FROM {SCHEMA}.users u JOIN {SCHEMA}.sessions s ON s.user_id = u.id WHERE s.id = %s AND s.expires_at > NOW()", [session_id])

        if not rows:
            return resp(401, {"error": "Сессия истекла"})

        user_id, nickname, email, car = rows[0]
        return resp(200, {"user": {"id": user_id, "nickname": nickname, "email": email, "car": car}})

    # logout
    if action == "logout" and method == "POST":
        if session_id:
            with get_conn() as conn:
                q(conn, f"UPDATE {SCHEMA}.sessions SET expires_at = NOW() WHERE id = %s", [session_id])
                conn.commit()
        return resp(200, {"ok": True})

    return resp(404, {"error": "Not found"})