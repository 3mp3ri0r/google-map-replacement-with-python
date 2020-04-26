import os

import aiohttp_cors # type: ignore
from aiohttp import web
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient # type: ignore

load_dotenv()

async def initiate_mongo(app: web.Application) -> None:
    host = os.environ.get("MONGO_HOST")
    raw_port = os.environ.get("MONGO_PORT")
    username = os.environ.get("MONGO_USERNAME") or None
    password = os.environ.get("MONGO_PASSWORD") or None
    port = int(raw_port) if raw_port else None
    client = AsyncIOMotorClient(host=host, port=port, username=username, password=password)
    app.map_db = client.maps
    app.client = client

async def close_mongo_client(app: web.Application) -> None:
    app.client.close() # type: ignore

async def handle_map(request: web.Request) -> web.Response:
    map_db = request.app.map_db # type: ignore
    collection = map_db.pois
    cursor = collection.find({}, {"_id": 0})
    pois = [poi async for poi in cursor]
    geo_json = {
        "type": "FeatureCollection",
        "name": "Point of Interests",
        "features": pois
    }
    return web.json_response(geo_json)

async def handle_map_nearby(request: web.Request) -> web.Response:
    lat = float(request.match_info.get('lat', 0))
    lng = float(request.match_info.get('lng', 0))
    map_db = request.app.map_db # type: ignore
    collection = map_db.pois
    cursor = collection.find({
        "geometry": {
            "$near": {
                "$geometry": {
                    "type": "Point" ,
                    "coordinates": [ lng , lat ]
                },
                "$maxDistance": 1000
            }
        }
    }, {"_id": 0})
    pois = [poi async for poi in cursor]
    geo_json = {
        "type": "FeatureCollection",
        "name": "Point of Interests",
        "features": pois
    }
    return web.json_response(geo_json)

async def handle(request: web.Request) -> web.Response:
    name = request.match_info.get('name', "Anonymous")
    text = "Hello, " + name
    return web.Response(text=text)

app = web.Application()
app.on_startup.append(initiate_mongo)
app.on_cleanup.append(close_mongo_client)
cors = aiohttp_cors.setup(app, defaults={
    "*": aiohttp_cors.ResourceOptions(
        allow_credentials=True,
        expose_headers="*",
        allow_headers="*",
    )
})
app.add_routes([web.get('/', handle),
                web.get('/map', handle_map),
                web.get('/map/{lat}/{lng}', handle_map_nearby),
                web.get('/{name}', handle)])
for route in list(app.router.routes()):
    cors.add(route)

if __name__ == '__main__':
    web.run_app(app)
