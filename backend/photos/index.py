import json
import os
import base64
import uuid
import boto3
import psycopg

SCHEMA = "t_p46767792_registration_website"
BUCKET = "files"
CDN_BASE = f"https://cdn.poehali.dev/projects/{os.environ.get('AWS_ACCESS_KEY_ID', '')}/bucket"

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


def get_user(session_id):
    if not session_id:
        return None
    with get_conn() as conn:
        rows = q(conn, f"SELECT u.id, u.nickname FROM {SCHEMA}.users u JOIN {SCHEMA}.sessions s ON s.user_id = u.id WHERE s.id = %s AND s.expires_at > NOW()", [session_id])
    return {"id": rows[0][0], "nickname": rows[0][1]} if rows else None


def get_s3():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )


def handler(event: dict, context) -> dict:
    """Галерея: загрузка фото (?action=upload), список фото (?action=list), лайк (?action=like)"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "")
    session_id = (event.get("headers") or {}).get("X-Session-Id", "")

    # GET list
    if action == "list" and method == "GET":
        with get_conn() as conn:
            rows = q(conn, f"""
                SELECT p.id, p.title, p.url, p.likes, p.created_at, u.nickname
                FROM {SCHEMA}.photos p
                JOIN {SCHEMA}.users u ON u.id = p.user_id
                ORDER BY p.created_at DESC
                LIMIT 50
            """)
        photos = [{"id": r[0], "title": r[1], "url": r[2], "likes": r[3], "author": r[5]} for r in rows]
        return resp(200, {"photos": photos})

    # POST upload
    if action == "upload" and method == "POST":
        user = get_user(session_id)
        if not user:
            return resp(401, {"error": "Войдите, чтобы добавить фото"})

        body = json.loads(event.get("body") or "{}")
        image_b64 = body.get("image")
        title = (body.get("title") or "").strip() or "Без названия"
        content_type = body.get("content_type", "image/jpeg")

        if not image_b64:
            return resp(400, {"error": "Изображение не передано"})

        image_data = base64.b64decode(image_b64)
        ext = "jpg" if "jpeg" in content_type else content_type.split("/")[-1]
        key = f"gallery/{uuid.uuid4()}.{ext}"

        s3 = get_s3()
        s3.put_object(Bucket=BUCKET, Key=key, Body=image_data, ContentType=content_type)
        cdn_url = f"{CDN_BASE}/{key}"

        with get_conn() as conn:
            rows = q(conn, f"INSERT INTO {SCHEMA}.photos (user_id, title, url) VALUES (%s, %s, %s) RETURNING id", [user["id"], title, cdn_url])
            conn.commit()
            photo_id = rows[0][0]

        return resp(200, {"id": photo_id, "url": cdn_url, "title": title, "author": user["nickname"], "likes": 0})

    # POST like
    if action == "like" and method == "POST":
        body = json.loads(event.get("body") or "{}")
        photo_id = body.get("photo_id")
        if not photo_id:
            return resp(400, {"error": "photo_id обязателен"})
        with get_conn() as conn:
            rows = q(conn, f"UPDATE {SCHEMA}.photos SET likes = likes + 1 WHERE id = %s RETURNING likes", [photo_id])
            conn.commit()
        if not rows:
            return resp(404, {"error": "Фото не найдено"})
        return resp(200, {"likes": rows[0][0]})

    return resp(404, {"error": "Not found"})
