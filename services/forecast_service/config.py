import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    supabase_url: str
    supabase_key: str
    supabase_service_key: str | None
    service_token: str | None
    request_timeout_seconds: float = 120.0

    @classmethod
    def from_env(cls) -> "Settings":
        url = os.getenv("SUPABASE_URL", "").strip()
        key = (
            os.getenv("SUPABASE_PUBLISHABLE_KEY", "").strip()
            or os.getenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "").strip()
        )
        timeout_raw = os.getenv("FORECAST_SERVICE_TIMEOUT_SECONDS", "120").strip()
        try:
            timeout = max(5.0, float(timeout_raw))
        except ValueError:
            timeout = 120.0
        return cls(
            supabase_url=url,
            supabase_key=key,
            supabase_service_key=(
                os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
                or os.getenv("SUPABASE_SECRET_KEY", "").strip()
                or None
            ),
            service_token=os.getenv("FORECAST_SERVICE_TOKEN", "").strip() or None,
            request_timeout_seconds=timeout,
        )

    @property
    def configured(self) -> bool:
        return bool(self.supabase_url and (self.supabase_key or self.supabase_service_key))
