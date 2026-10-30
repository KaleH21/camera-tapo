import uuid

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


def error(status: int, code: str, message: str) -> HTTPException:
    return HTTPException(status_code=status, detail={'code': code, 'message': message})


def install_error_handlers(app: FastAPI) -> None:
    @app.middleware('http')
    async def request_id(request: Request, call_next):
        request.state.request_id = str(uuid.uuid4())
        response = await call_next(request)
        response.headers['X-Request-ID'] = request.state.request_id
        return response

    @app.exception_handler(HTTPException)
    async def http_error(request: Request, exc: HTTPException):
        detail = exc.detail if isinstance(exc.detail, dict) else {'code': 'REQUEST_FAILED', 'message': str(exc.detail)}
        return JSONResponse(status_code=exc.status_code, content={'error': {**detail, 'request_id': request.state.request_id}})

    @app.exception_handler(RequestValidationError)
    async def validation_error(request: Request, _: RequestValidationError):
        return JSONResponse(status_code=422, content={'error': {
            'code': 'VALIDATION_ERROR', 'message': 'Dữ liệu gửi lên không hợp lệ',
            'request_id': request.state.request_id,
        }})

