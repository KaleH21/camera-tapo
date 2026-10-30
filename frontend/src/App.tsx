import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  ArrowRight,
  Camera,
  ChevronDown,
  CircleHelp,
  Clock3,
  Eye,
  EyeOff,
  House,
  LockKeyhole,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Radio,
  Settings2,
  ShieldCheck,
  Signal,
  Trash2,
  VideoOff,
  WifiOff,
  X,
} from "lucide-react";

type User = { username: string; role: "admin" | "viewer"; csrf_token: string };
type CameraItem = {
  id: string;
  name: string;
  host?: string;
  port?: number;
  stream_path?: string;
  username?: string;
  enabled: boolean;
  status: "online" | "offline" | "disabled";
  last_frame_at: string | null;
  live_url: string;
};
type CameraForm = {
  name: string;
  host: string;
  port: number;
  stream_path: string;
  username: string;
  password: string;
};
const blankForm: CameraForm = {
  name: "",
  host: "",
  port: 554,
  stream_path: "/stream1",
  username: "",
  password: "",
};

async function api<T>(
  path: string,
  init?: RequestInit,
  csrf?: string,
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(csrf ? { "X-CSRF-Token": csrf } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error?.message || "Không thể thực hiện yêu cầu");
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

function LivePlayer({ camera }: { camera: CameraItem }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<"loading" | "playing" | "error">(
    "loading",
  );
  useEffect(() => {
    const video = videoRef.current;
    if (!video || camera.status !== "online") return;
    setState("loading");
    const playing = () => setState("playing");
    const failed = () => setState("error");
    video.addEventListener("playing", playing);
    video.addEventListener("error", failed);
    let disposed = false;
    let hls: InstanceType<typeof import('hls.js').default> | undefined;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = camera.live_url;
      video.play().catch(() => {});
    } else {
      import('hls.js').then(({ default: Hls }) => {
        if (disposed) return;
        if (!Hls.isSupported()) { setState('error'); return; }
        hls = new Hls({ liveSyncDurationCount: 3, maxBufferLength: 20 });
        hls.loadSource(camera.live_url);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            setState('error');
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls?.startLoad();
            else hls?.recoverMediaError();
          }
        });
        video.play().catch(() => {});
      }).catch(() => { if (!disposed) setState('error'); });
    }
    return () => {
      disposed = true;
      hls?.destroy();
      video.pause();
      video.removeAttribute('src');
      video.removeEventListener("playing", playing);
      video.removeEventListener("error", failed);
    };
  }, [camera.id, camera.live_url, camera.status]);

  return (
    <div className="video-frame">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        controls={state === "playing"}
        aria-label={`Video trực tiếp ${camera.name}`}
      />
      {camera.status !== "online" && (
        <div className="video-placeholder">
          <div className="placeholder-icon">
            <VideoOff size={28} />
          </div>
          <strong>Camera chưa có tín hiệu</strong>
          <span>Kiểm tra nguồn điện, mạng LAN và tài khoản camera.</span>
        </div>
      )}
      {camera.status === "online" && state !== "playing" && (
        <div className="video-placeholder">
          <div className="spinner" />
          <strong>
            {state === "loading"
              ? "Đang tải luồng trực tiếp"
              : "Đang kết nối lại"}
          </strong>
          <span>Vui lòng chờ trong giây lát.</span>
        </div>
      )}
      <div className="video-top">
        <span
          className={`live-chip ${camera.status === "online" ? "" : "is-off"}`}
        >
          <span className="pulse-dot" />
          {camera.status === "online" ? "TRỰC TIẾP" : "NGOẠI TUYẾN"}
        </span>
        <span className="video-name">{camera.name}</span>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);
  const [login, setLogin] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [cameras, setCameras] = useState<CameraItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<"overview" | "cameras" | "settings">(
    "overview",
  );
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<CameraForm>(blankForm);
  const [busy, setBusy] = useState(false);
  const [loginError, setLoginError] = useState("");
  const refreshErrorShown = useRef(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [menuCamera, setMenuCamera] = useState<string | null>(null);
  const [viewers, setViewers] = useState<{ id: string; username: string; role: string }[]>([]);
  const [viewerForm, setViewerForm] = useState({ username: '', password: '' });

  const refresh = useCallback(async () => {
    try {
      const data = await api<{ items: CameraItem[] }>("/api/v1/cameras");
      setCameras(data.items);
      refreshErrorShown.current = false;
      setSelectedId((previous) =>
        data.items.some((item) => item.id === previous)
          ? previous
          : data.items[0]?.id || null,
      );
    } catch (error) {
      if (!refreshErrorShown.current) toast.error((error as Error).message);
      refreshErrorShown.current = true;
    }
  }, []);

  useEffect(() => {
    api<User>("/api/v1/auth/me")
      .then(setUser)
      .catch(() => {})
      .finally(() => setBooting(false));
  }, []);
  useEffect(() => {
    if (!user) return;
    refresh();
    const timer = window.setInterval(refresh, 7000);
    return () => window.clearInterval(timer);
  }, [user, refresh]);
  useEffect(() => {
    if (user?.role !== 'admin' || view !== 'settings') return;
    api<{ items: { id: string; username: string; role: string }[] }>('/api/v1/users')
      .then(data => setViewers(data.items))
      .catch(error => toast.error((error as Error).message));
  }, [user, view]);

  const selected = cameras.find((camera) => camera.id === selectedId);
  const onlineCount = cameras.filter(
    (camera) => camera.status === "online",
  ).length;

  async function submitLogin(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setLoginError("");
    try {
      setUser(
        await api<User>("/api/v1/auth/login", {
          method: "POST",
          body: JSON.stringify(login),
        }),
      );
      setLogin({ username: "", password: "" });
    } catch (error) {
      setLoginError((error as Error).message);
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    if (!user) return;
    try {
      await api("/api/v1/auth/logout", { method: "POST" }, user.csrf_token);
      setUser(null);
      setCameras([]);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }
  function openModal(mode: "add" | "edit", camera?: CameraItem) {
    setForm(
      camera
        ? {
            name: camera.name,
            host: camera.host || '',
            port: camera.port || 554,
            stream_path: camera.stream_path || '/stream1',
            username: camera.username || '',
            password: "",
          }
        : blankForm,
    );
    setModal(mode);
    setMenuCamera(null);
  }
  async function saveCamera(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      const path =
        modal === "edit" && selected
          ? `/api/v1/cameras/${selected.id}`
          : "/api/v1/cameras";
      const payload =
        modal === "edit" && !form.password
          ? Object.fromEntries(
              Object.entries(form).filter(([key]) => key !== "password"),
            )
          : form;
      const saved = await api<CameraItem>(
        path,
        {
          method: modal === "edit" ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
        user.csrf_token,
      );
      setModal(null);
      setSelectedId(saved.id);
      toast.success("Đã lưu camera");
      await refresh();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function testCamera(camera: CameraItem) {
    if (!user) return;
    setBusy(true);
    setMenuCamera(null);
    try {
      const result = await api<{ ok: boolean; message: string }>(
        `/api/v1/cameras/${camera.id}/test`,
        { method: "POST" },
        user.csrf_token,
      );
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
      refresh();
    }
  }
  async function deleteCamera(camera: CameraItem) {
    if (!user || !window.confirm(`Xóa camera “${camera.name}”?`)) return;
    try {
      await api(
        `/api/v1/cameras/${camera.id}`,
        { method: "DELETE" },
        user.csrf_token,
      );
      toast.success("Đã xóa camera");
      setMenuCamera(null);
      await refresh();
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  async function addViewer(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      await api('/api/v1/users', { method: 'POST', body: JSON.stringify(viewerForm) }, user.csrf_token);
      setViewerForm({ username: '', password: '' });
      const data = await api<{ items: { id: string; username: string; role: string }[] }>('/api/v1/users');
      setViewers(data.items);
      toast.success('Đã tạo tài khoản người xem');
    } catch (error) { toast.error((error as Error).message); }
    finally { setBusy(false); }
  }

  if (booting)
    return (
      <div className="boot">
        <div className="spinner" />
        <span>Đang khởi động Tapo Home Monitor</span>
      </div>
    );
  if (!user)
    return (
      <main className="login-page">
        <div className="login-art">
          <div className="brand">
            <div className="brand-mark">
              <Camera size={24} />
            </div>
            <span>
              Tapo<span className="brand-light">Home</span>
            </span>
          </div>
          <div className="login-art-copy">
            <span className="eyebrow">
              <span className="tiny-dot" /> KHÔNG GIAN RIÊNG CỦA GIA ĐÌNH
            </span>
            <h1>
              An tâm hơn,
              <br />
              <em>mọi lúc.</em>
            </h1>
            <p>
              Theo dõi ngôi nhà của bạn qua một giao diện riêng tư, rõ ràng và
              dễ sử dụng.
            </p>
            <div className="art-feature">
              <ShieldCheck size={20} />
              <span>Truy cập an toàn trong mạng riêng</span>
            </div>
          </div>
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-core">
            <Camera size={54} strokeWidth={1.4} />
          </div>
          <div className="art-caption">
            <span className="tiny-dot" /> Bảo vệ không gian của bạn
          </div>
        </div>
        <div className="login-panel">
          <div className="login-card">
            <div className="login-small-icon">
              <LockKeyhole size={22} />
            </div>
            <span className="overline">CHÀO MỪNG TRỞ LẠI</span>
            <h2>Đăng nhập</h2>
            <p>Nhập tài khoản của bạn để xem camera gia đình.</p>
            <form onSubmit={submitLogin}>
              <label htmlFor="login-user">Tên đăng nhập</label>
              <input
                id="login-user"
                autoComplete="username"
                value={login.username}
                onChange={(e) =>
                  setLogin({ ...login, username: e.target.value })
                }
                required
                placeholder="Nhập tên đăng nhập"
              />
              <label htmlFor="login-password">Mật khẩu</label>
              <div className="password-field">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={login.password}
                  onChange={(e) =>
                    setLogin({ ...login, password: e.target.value })
                  }
                  required
                  placeholder="Nhập mật khẩu"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button className="primary-button login-submit" disabled={busy}>
                {busy ? "Đang đăng nhập…" : "Vào bảng điều khiển"}{" "}
                <ArrowRight size={18} />
              </button>
            </form>
            {loginError && (
              <div role="alert" className="form-message">
                {loginError}
              </div>
            )}
            <div className="login-foot">
              <LockKeyhole size={14} /> Chỉ dành cho thành viên được cấp quyền
            </div>
          </div>
        </div>
      </main>
    );

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Đến nội dung chính
      </a>
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="sidebar-head">
          <div className="brand">
            <div className="brand-mark">
              <Camera size={21} />
            </div>
            <span>
              Tapo<span className="brand-light">Home</span>
            </span>
          </div>
          <button
            className="mobile-close"
            aria-label="Đóng menu"
            onClick={() => setMobileNav(false)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="sidebar-caption">KHÔNG GIAN CỦA BẠN</div>
        <nav aria-label="Điều hướng chính">
          <button
            className={`nav-item ${view === "overview" ? "active" : ""}`}
            onClick={() => {
              setView("overview");
              setMobileNav(false);
            }}
          >
            <House size={19} /> Tổng quan
          </button>
          <button
            className={`nav-item ${view === "cameras" ? "active" : ""}`}
            onClick={() => {
              setView("cameras");
              setMobileNav(false);
            }}
          >
            <Camera size={19} /> Camera{" "}
            <span className="nav-count">{cameras.length}</span>
          </button>
          <button
            className={`nav-item ${view === "settings" ? "active" : ""}`}
            onClick={() => {
              setView("settings");
              setMobileNav(false);
            }}
          >
            <Settings2 size={19} /> Hệ thống
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-note">
            <ShieldCheck size={18} />
            <div>
              <strong>Kết nối riêng tư</strong>
              <span>Chỉ truy cập qua mạng nhà hoặc VPN của bạn.</span>
            </div>
          </div>
          <div className="profile">
            <div className="avatar">
              {user.username.slice(0, 1).toUpperCase()}
            </div>
            <div className="profile-text">
              <strong>{user.username}</strong>
              <span>
                {user.role === "admin" ? "Quản trị viên" : "Người xem"}
              </span>
            </div>
            <button aria-label="Đăng xuất" title="Đăng xuất" onClick={logout}>
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
      {mobileNav && (
        <button
          className="mobile-scrim"
          aria-label="Đóng menu"
          onClick={() => setMobileNav(false)}
        />
      )}
      <div className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu"
            aria-label="Mở menu"
            onClick={() => setMobileNav(true)}
          >
            <Menu size={22} />
          </button>
          <div className="breadcrumb">
            <span>Không gian của tôi</span>
            <span className="crumb-separator">/</span>
            <strong>
              {view === "overview"
                ? "Tổng quan"
                : view === "cameras"
                  ? "Camera"
                  : "Hệ thống"}
            </strong>
          </div>
          <div className="top-actions">
            <span className="connection-pill">
              <span className="tiny-dot" /> Hệ thống đang hoạt động
            </span>
            <button
              className="icon-button"
              aria-label="Làm mới"
              title="Làm mới"
              onClick={refresh}
            >
              <RefreshCw size={18} />
            </button>
            <div className="top-avatar">
              {user.username.slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>
        <main id="main" className="content">
          <div className="page-heading">
            <div>
              <span className="overline">TAPO HOME MONITOR</span>
              <h1>
                {view === "overview"
                  ? "Xin chào, " + user.username
                  : view === "cameras"
                    ? "Camera của bạn"
                    : "Hệ thống"}
              </h1>
              <p>
                {view === "overview"
                  ? "Một góc nhìn rõ ràng về ngôi nhà của bạn."
                  : view === "cameras"
                    ? "Quản lý camera và theo dõi kết nối trực tiếp."
                    : "Thông tin vận hành và quyền truy cập của hệ thống."}
              </p>
            </div>
            {user.role === "admin" && view !== "settings" && (
              <button
                className="primary-button add-top"
                onClick={() => openModal("add")}
              >
                <Plus size={18} /> Thêm camera
              </button>
            )}
          </div>
          {view === "settings" ? (
            <div className="settings-grid">
              <section className="panel setting-panel">
                <div className="setting-icon">
                  <ShieldCheck size={24} />
                </div>
                <h2>Truy cập an toàn</h2>
                <p>
                  Luồng RTSP chỉ được xử lý trên server trong mạng LAN. Trình
                  duyệt nhận HLS qua API có xác thực.
                </p>
                <div className="setting-row">
                  <span>Vai trò hiện tại</span>
                  <strong>
                    {user.role === "admin" ? "Quản trị viên" : "Người xem"}
                  </strong>
                </div>
                <div className="setting-row">
                  <span>Truy cập từ xa</span>
                  <strong>Qua VPN riêng</strong>
                </div>
              </section>
              <section className="panel setting-panel">
                <div className="setting-icon violet">
                  <Activity size={24} />
                </div>
                <h2>Trạng thái triển khai</h2>
                <p>
                  Phiên bản đầu tập trung vào xem live ổn định. Sự kiện, nhận
                  diện và cảnh báo sẽ được phát triển ở các giai đoạn tiếp theo.
                </p>
                <div className="setting-row">
                  <span>Camera đã cấu hình</span>
                  <strong>{cameras.length}</strong>
                </div>
                <div className="setting-row">
                  <span>Camera trực tuyến</span>
                  <strong>{onlineCount}</strong>
                </div>
              </section>
              {user.role === 'admin' && <section className="panel setting-panel viewer-panel">
                <div className="setting-icon"><Eye size={24} /></div>
                <h2>Người xem</h2>
                <p>Tạo tài khoản cho người nhà. Người xem có thể xem live nhưng không thay đổi cấu hình camera.</p>
                <div className="viewer-list">{viewers.filter(item => item.role === 'viewer').map(item => <div className="setting-row" key={item.id}><span>{item.username}</span><strong>Người xem</strong></div>)}{viewers.every(item => item.role !== 'viewer') && <span className="viewer-empty">Chưa có người xem.</span>}</div>
                <form onSubmit={addViewer} className="viewer-form"><label htmlFor="viewer-name">Tên đăng nhập</label><input id="viewer-name" value={viewerForm.username} onChange={e => setViewerForm({ ...viewerForm, username: e.target.value })} minLength={3} maxLength={40} pattern="[a-zA-Z0-9_-]+" required /><label htmlFor="viewer-password">Mật khẩu (tối thiểu 12 ký tự)</label><input id="viewer-password" type="password" autoComplete="new-password" value={viewerForm.password} onChange={e => setViewerForm({ ...viewerForm, password: e.target.value })} minLength={12} required /><button className="primary-button" disabled={busy}><Plus size={16} /> Tạo người xem</button></form>
              </section>}
            </div>
          ) : (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon blue">
                    <Camera size={20} />
                  </div>
                  <div className="stat-label">Tổng camera</div>
                  <div className="stat-value">
                    {cameras.length.toString().padStart(2, "0")}
                  </div>
                  <div className="stat-sub">Đã thêm vào hệ thống</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon green">
                    <Signal size={20} />
                  </div>
                  <div className="stat-label">Đang trực tuyến</div>
                  <div className="stat-value">
                    {onlineCount.toString().padStart(2, "0")}
                  </div>
                  <div className="stat-sub">
                    <span className="tiny-dot" /> Cập nhật tự động
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon amber">
                    <WifiOff size={20} />
                  </div>
                  <div className="stat-label">Mất kết nối</div>
                  <div className="stat-value">
                    {cameras
                      .filter((c) => c.status === "offline")
                      .length.toString()
                      .padStart(2, "0")}
                  </div>
                  <div className="stat-sub">Cần kiểm tra nếu kéo dài</div>
                </div>
              </div>
              <section className="workspace-grid">
                <div className="panel live-panel">
                  <div className="panel-heading">
                    <div>
                      <div className="section-kicker">
                        <span className="tiny-dot" /> THEO DÕI THỜI GIAN THỰC
                      </div>
                      <h2>Trực tiếp</h2>
                    </div>
                    {selected && (
                      <div className="select-wrap">
                        <select
                          aria-label="Chọn camera"
                          value={selected.id}
                          onChange={(e) => setSelectedId(e.target.value)}
                        >
                          {cameras.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={16} />
                      </div>
                    )}
                  </div>
                  {selected ? (
                    <>
                      <LivePlayer camera={selected} />
                      <div className="live-details">
                        <div>
                          <span className="detail-label">TRẠNG THÁI</span>
                          <strong
                            className={
                              selected.status === "online"
                                ? "text-green"
                                : "text-muted"
                            }
                          >
                            {selected.status === "online"
                              ? "Đang trực tuyến"
                              : selected.status === "disabled"
                                ? "Đã tắt"
                                : "Mất kết nối"}
                          </strong>
                        </div>
                        <div>
                          <span className="detail-label">LUỒNG PHÁT</span>
                          <strong>
                            {selected.stream_path === "/stream1"
                              ? "Chất lượng cao"
                              : "Tiết kiệm băng thông"}
                          </strong>
                        </div>
                        <div>
                          <span className="detail-label">FRAME GẦN NHẤT</span>
                          <strong>
                            {selected.last_frame_at
                              ? new Date(
                                  selected.last_frame_at,
                                ).toLocaleTimeString("vi-VN", {
                                  timeZone: "Asia/Bangkok",
                                })
                              : "Chưa có"}
                          </strong>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="empty-live">
                      <div className="empty-icon">
                        <Camera size={34} />
                      </div>
                      <h3>Chưa có camera nào</h3>
                      <p>
                        Thêm camera Tapo C220 để bắt đầu theo dõi ngôi nhà của
                        bạn.
                      </p>
                      {user.role === "admin" && (
                        <button
                          className="primary-button"
                          onClick={() => openModal("add")}
                        >
                          <Plus size={17} /> Thêm camera đầu tiên
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="panel camera-panel">
                  <div className="panel-heading">
                    <div>
                      <div className="section-kicker neutral">
                        THIẾT BỊ CỦA BẠN
                      </div>
                      <h2>Danh sách camera</h2>
                    </div>
                    <span className="count-badge">{cameras.length}</span>
                  </div>
                  <div className="camera-list">
                    {cameras.map((camera) => (
                      <div
                        className={`camera-row ${selectedId === camera.id ? "selected" : ""}`}
                        key={camera.id}
                      >
                        <button
                          className="camera-pick"
                          onClick={() => setSelectedId(camera.id)}
                        >
                          <div className="camera-thumb">
                            <Camera size={22} />
                          </div>
                          <div className="camera-copy">
                            <strong>{camera.name}</strong>
                            <span>
                              {camera.host ? `${camera.host} · ${camera.stream_path}` : 'Camera gia đình'}
                            </span>
                          </div>
                        </button>
                        <div className="camera-row-end">
                          <span
                            className={`status-dot ${camera.status}`}
                            title={camera.status}
                          />
                          {user.role === "admin" && (
                            <div className="row-menu-wrap">
                              <button
                                className="more-button"
                                aria-label={`Tùy chọn ${camera.name}`}
                                onClick={() =>
                                  setMenuCamera(
                                    menuCamera === camera.id ? null : camera.id,
                                  )
                                }
                              >
                                <MoreHorizontal size={19} />
                              </button>
                              {menuCamera === camera.id && (
                                <div className="row-menu">
                                  <button
                                    onClick={() => {
                                      setSelectedId(camera.id);
                                      openModal("edit", camera);
                                    }}
                                  >
                                    <Settings2 size={15} /> Chỉnh sửa
                                  </button>
                                  <button
                                    disabled={busy}
                                    onClick={() => testCamera(camera)}
                                  >
                                    <Radio size={15} /> Kiểm tra
                                  </button>
                                  <button
                                    className="danger"
                                    onClick={() => deleteCamera(camera)}
                                  >
                                    <Trash2 size={15} /> Xóa camera
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {cameras.length === 0 && (
                      <div className="camera-empty">
                        Camera sẽ xuất hiện ở đây sau khi bạn thêm thiết bị.
                      </div>
                    )}
                  </div>
                  <div className="camera-panel-foot">
                    <Clock3 size={15} /> Tự động làm mới mỗi 7 giây
                  </div>
                </div>
              </section>
              <div className="info-strip">
                <div className="info-icon">
                  <CircleHelp size={20} />
                </div>
                <div>
                  <strong>Mẹo kết nối</strong>
                  <span>
                    Để xem từ xa, hãy kết nối VPN gia đình trước khi mở trang
                    này.
                  </span>
                </div>
                <button onClick={() => setView("settings")}>
                  Tìm hiểu thêm <ArrowRight size={15} />
                </button>
              </div>
            </>
          )}
        </main>
      </div>
      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="modal-head">
              <div>
                <span className="overline">CẤU HÌNH THIẾT BỊ</span>
                <h2 id="modal-title">
                  {modal === "add" ? "Thêm camera mới" : "Chỉnh sửa camera"}
                </h2>
              </div>
              <button
                className="icon-button"
                aria-label="Đóng"
                onClick={() => setModal(null)}
              >
                <X size={20} />
              </button>
            </div>
            <p className="modal-intro">
              Sử dụng Camera Account đã tạo trong ứng dụng Tapo. Camera cần có
              IP cố định trong mạng nhà.
            </p>
            <form onSubmit={saveCamera} className="camera-form">
              <label htmlFor="cam-name">Tên camera</label>
              <input
                id="cam-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ví dụ: Phòng khách"
                maxLength={80}
                required
              />
              <div className="form-columns">
                <div>
                  <label htmlFor="cam-host">Địa chỉ IP trong LAN</label>
                  <input
                    id="cam-host"
                    value={form.host}
                    onChange={(e) => setForm({ ...form, host: e.target.value })}
                    placeholder="192.168.1.100"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="cam-port">Cổng RTSP</label>
                  <input
                    id="cam-port"
                    type="number"
                    min="1"
                    max="65535"
                    value={form.port}
                    onChange={(e) =>
                      setForm({ ...form, port: Number(e.target.value) })
                    }
                    required
                  />
                </div>
              </div>
              <label htmlFor="cam-stream">Luồng phát</label>
              <select
                id="cam-stream"
                value={form.stream_path}
                onChange={(e) =>
                  setForm({ ...form, stream_path: e.target.value })
                }
              >
                <option value="/stream1">/stream1 · Chất lượng cao</option>
                <option value="/stream2">
                  /stream2 · Tiết kiệm băng thông
                </option>
              </select>
              <div className="form-columns">
                <div>
                  <label htmlFor="cam-user">Camera Account</label>
                  <input
                    id="cam-user"
                    autoComplete="off"
                    value={form.username}
                    onChange={(e) =>
                      setForm({ ...form, username: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label htmlFor="cam-password">
                    Mật khẩu{" "}
                    {modal === "edit" && <span>(để trống nếu giữ nguyên)</span>}
                  </label>
                  <input
                    id="cam-password"
                    type="password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    required={modal === "add"}
                  />
                </div>
              </div>
              <div className="form-note">
                <LockKeyhole size={16} /> Mật khẩu được mã hóa trên server và
                không hiển thị lại.
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setModal(null)}
                >
                  Hủy
                </button>
                <button className="primary-button" disabled={busy}>
                  {busy ? "Đang lưu…" : "Lưu camera"} <ArrowRight size={17} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
