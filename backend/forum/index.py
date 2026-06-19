import json
import os
import psycopg

SCHEMA = "t_p46767792_registration_website"
CATEGORIES = ["Техника", "Тюнинг", "Путешествия", "Электрика", "Общее"]

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
    "Content-Type": "application/json",
}


def resp(status, data):
    return {"statusCode": status, "headers": CORS, "body": json.dumps(data, ensure_ascii=False, default=str)}


def get_conn():
    return psycopg.connect(
        os.environ["DATABASE_URL"],
        prepare_threshold=None,
        cursor_factory=psycopg.ClientCursor,
    )


def q(conn, sql, params=None):
    with conn.cursor() as cur:
        if params:
            cur.execute(cur.mogrify(sql, params))
        else:
            cur.execute(sql)
        try:
            return cur.fetchall()
        except Exception:
            return []


def get_user(session_id):
    if not session_id:
        return None
    with get_conn() as conn:
        rows = q(conn, f"SELECT u.id, u.nickname FROM {SCHEMA}.users u JOIN {SCHEMA}.sessions s ON s.user_id = u.id WHERE s.id = %s AND s.expires_at > NOW()", [session_id])
    return {"id": rows[0][0], "nickname": rows[0][1]} if rows else None


def handler(event: dict, context) -> dict:
    """Форум: list, get, create_topic, create_reply. action в query (?action=...)"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "")
    session_id = (event.get("headers") or {}).get("X-Session-Id", "")
    body = json.loads(event.get("body") or "{}")

    # GET list — список тем
    if action == "list" and method == "GET":
        category = qs.get("category", "")
        with get_conn() as conn:
            if category and category in CATEGORIES:
                rows = q(conn, f"""
                    SELECT t.id, t.category, t.title, t.views, t.replies_count, t.created_at, u.nickname
                    FROM {SCHEMA}.forum_topics t JOIN {SCHEMA}.users u ON u.id = t.user_id
                    WHERE t.category = %s ORDER BY t.created_at DESC LIMIT 50
                """, [category])
            else:
                rows = q(conn, f"""
                    SELECT t.id, t.category, t.title, t.views, t.replies_count, t.created_at, u.nickname
                    FROM {SCHEMA}.forum_topics t JOIN {SCHEMA}.users u ON u.id = t.user_id
                    ORDER BY t.created_at DESC LIMIT 50
                """)
        topics = [{"id": r[0], "category": r[1], "title": r[2], "views": r[3], "replies": r[4], "created_at": str(r[5]), "author": r[6]} for r in rows]
        return resp(200, {"topics": topics, "categories": CATEGORIES})

    # GET get — одна тема с ответами
    if action == "get" and method == "GET":
        topic_id = qs.get("id")
        if not topic_id:
            return resp(400, {"error": "id обязателен"})
        with get_conn() as conn:
            q(conn, f"UPDATE {SCHEMA}.forum_topics SET views = views + 1 WHERE id = %s", [topic_id])
            conn.commit()
            rows = q(conn, f"""
                SELECT t.id, t.category, t.title, t.body, t.views, t.replies_count, t.created_at, u.nickname
                FROM {SCHEMA}.forum_topics t JOIN {SCHEMA}.users u ON u.id = t.user_id
                WHERE t.id = %s
            """, [topic_id])
            if not rows:
                return resp(404, {"error": "Тема не найдена"})
            t = rows[0]
            topic = {"id": t[0], "category": t[1], "title": t[2], "body": t[3], "views": t[4], "replies": t[5], "created_at": str(t[6]), "author": t[7]}

            replies_rows = q(conn, f"""
                SELECT r.id, r.body, r.created_at, u.nickname
                FROM {SCHEMA}.forum_replies r JOIN {SCHEMA}.users u ON u.id = r.user_id
                WHERE r.topic_id = %s ORDER BY r.created_at ASC
            """, [topic_id])
            replies = [{"id": r[0], "body": r[1], "created_at": str(r[2]), "author": r[3]} for r in replies_rows]
        return resp(200, {"topic": topic, "replies": replies})

    # POST create_topic
    if action == "create_topic" and method == "POST":
        user = get_user(session_id)
        if not user:
            return resp(401, {"error": "Войдите, чтобы создать тему"})
        title = (body.get("title") or "").strip()
        text = (body.get("body") or "").strip()
        category = (body.get("category") or "Общее").strip()
        if not title or not text:
            return resp(400, {"error": "Заполните заголовок и текст"})
        if category not in CATEGORIES:
            category = "Общее"
        with get_conn() as conn:
            rows = q(conn, f"INSERT INTO {SCHEMA}.forum_topics (user_id, category, title, body) VALUES (%s, %s, %s, %s) RETURNING id", [user["id"], category, title, text])
            conn.commit()
        return resp(200, {"id": rows[0][0], "title": title, "category": category, "author": user["nickname"]})

    # POST create_reply
    if action == "create_reply" and method == "POST":
        user = get_user(session_id)
        if not user:
            return resp(401, {"error": "Войдите, чтобы ответить"})
        topic_id = body.get("topic_id")
        text = (body.get("body") or "").strip()
        if not topic_id or not text:
            return resp(400, {"error": "topic_id и текст обязательны"})
        with get_conn() as conn:
            rows = q(conn, f"INSERT INTO {SCHEMA}.forum_replies (topic_id, user_id, body) VALUES (%s, %s, %s) RETURNING id, created_at", [topic_id, user["id"], text])
            q(conn, f"UPDATE {SCHEMA}.forum_topics SET replies_count = replies_count + 1 WHERE id = %s", [topic_id])
            conn.commit()
        return resp(200, {"id": rows[0][0], "body": text, "author": user["nickname"], "created_at": str(rows[0][1])})

    return resp(404, {"error": "Not found"})
