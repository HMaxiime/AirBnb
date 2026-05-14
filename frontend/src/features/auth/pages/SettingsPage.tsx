import { useState, useRef } from "react";
import { DashboardLayout } from "../../../shared/components/DashboardLayout";
import { useAuth } from "../hooks/useAuth";
import {
  authService,
  profileService,
  uploadService,
} from "../../../lib/apiService";

type Status = "idle" | "loading" | "success" | "error";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function apiError(err: unknown): string {
  return (
    (err as { response?: { data?: { error?: string } } })?.response?.data
      ?.error ?? ""
  );
}

export function SettingsPage(): React.JSX.Element {
  const { user, updateUser } = useAuth();
  const [activeSection, setActiveSection] = useState<
    "profile" | "password" | "name"
  >("profile");

  // ── Name ──────────────────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [nameStatus, setNameStatus] = useState<Status>("idle");
  const [nameError, setNameError] = useState("");

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setNameStatus("loading");
    setNameError("");
    try {
      await profileService.updateName(user.id, firstName, lastName);
      const full = `${firstName.trim()} ${lastName.trim()}`.trim();
      updateUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: full,
      });
      setNameStatus("success");
    } catch (err) {
      setNameError(apiError(err) || "Failed to update name");
      setNameStatus("error");
    }
  }

  // ── Password ──────────────────────────────────────────────────────────────
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwStatus, setPwStatus] = useState<Status>("idle");
  const [pwError, setPwError] = useState("");

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) {
      setPwError("New passwords do not match");
      return;
    }
    setPwStatus("loading");
    setPwError("");
    try {
      await authService.changePassword(currentPw, newPw);
      setPwStatus("success");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err) {
      setPwError(apiError(err) || "Failed to change password");
      setPwStatus("error");
    }
  }

  // ── Avatar ────────────────────────────────────────────────────────────────
  const [avatarStatus, setAvatarStatus] = useState<Status>("idle");
  const [avatarError, setAvatarError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setPreview(URL.createObjectURL(file));
    setAvatarStatus("idle");
    setAvatarError("");
    e.target.value = "";
  }

  async function handleSaveAvatar() {
    if (!pendingFile || !user) return;
    setAvatarStatus("loading");
    setAvatarError("");
    try {
      const { avatar } = await uploadService.uploadAvatar(user.id, pendingFile);
      updateUser({ avatar });
      setAvatarStatus("success");
      setPendingFile(null);
    } catch (err) {
      setAvatarError(apiError(err) || "Failed to upload photo");
      setAvatarStatus("error");
    }
  }

  const currentAvatar = preview ?? user?.avatar ?? null;

  const inputCls =
    "w-full px-3 py-2.5 border border-[#ebebeb] dark:border-[#2a2a2a] rounded-lg text-sm bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff5a5f] focus:border-transparent transition";

  const saveBtnCls =
    "px-5 py-2.5 bg-[#ff5a5f] text-white text-sm font-semibold rounded-lg hover:bg-[#e04e53] transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  const sectionButtonCls = (section: typeof activeSection) =>
    `w-full rounded-2xl border px-5 py-4 text-left transition-all duration-200 ${
      activeSection === section
        ? "border-[#ff5a5f] bg-[#fff0f0] dark:bg-[#2a1a1a] shadow-sm"
        : "border-[#ebebeb] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] hover:border-[#ffb8ba] hover:bg-[#fffaf9] dark:hover:bg-[#242424]"
    }`;

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-3xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Settings
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Choose what you want to update.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setActiveSection("profile")}
              className={sectionButtonCls("profile")}
            >
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Profile photo
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Upload a new profile picture.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection("password")}
              className={sectionButtonCls("password")}
            >
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Change password
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Update your account password.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection("name")}
              className={sectionButtonCls("name")}
            >
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Update names
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Edit your first and last name.
              </div>
            </button>
          </div>

          <div className="mx-auto max-w-2xl">
            {activeSection === "profile" && (
              <section className="bg-white dark:bg-[#1a1a1a] border border-[#ebebeb] dark:border-[#2a2a2a] rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-[#ebebeb] dark:border-[#2a2a2a]">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Profile picture
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    JPEG, PNG, WEBP or GIF · max 5 MB
                  </p>
                </div>
                <div className="px-6 py-5 flex items-center gap-5">
                  {currentAvatar ? (
                    <img
                      src={currentAvatar}
                      alt="avatar"
                      className="w-20 h-20 rounded-full object-cover flex-shrink-0 border border-[#ebebeb] dark:border-[#2a2a2a]"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-[#ff5a5f] text-white text-2xl font-bold flex items-center justify-center flex-shrink-0">
                      {user ? getInitials(user.name) : "?"}
                    </div>
                  )}

                  <div className="flex flex-col gap-2 min-w-0">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 border border-[#ebebeb] dark:border-[#2a2a2a] text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-[#242424] transition-colors"
                    >
                      Choose photo
                    </button>

                    {pendingFile && (
                      <button
                        type="button"
                        onClick={handleSaveAvatar}
                        disabled={avatarStatus === "loading"}
                        className={saveBtnCls}
                      >
                        {avatarStatus === "loading"
                          ? "Uploading…"
                          : "Apply photo"}
                      </button>
                    )}

                    {avatarStatus === "success" && !pendingFile && (
                      <p className="text-xs text-emerald-600 font-medium">
                        Photo updated!
                      </p>
                    )}
                    {avatarError && (
                      <p className="text-xs text-red-500">{avatarError}</p>
                    )}
                  </div>
                </div>
              </section>
            )}

            {activeSection === "name" && (
              <section className="bg-white dark:bg-[#1a1a1a] border border-[#ebebeb] dark:border-[#2a2a2a] rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-[#ebebeb] dark:border-[#2a2a2a]">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Full name
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Update your first and last name.
                  </p>
                </div>
                <form onSubmit={handleSaveName} className="px-6 py-5 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        First name
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          setNameStatus("idle");
                        }}
                        required
                        placeholder="First name"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Last name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value);
                          setNameStatus("idle");
                        }}
                        placeholder="Last name"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {nameError && (
                    <p className="text-xs text-red-500">{nameError}</p>
                  )}
                  {nameStatus === "success" && (
                    <p className="text-xs text-emerald-600 font-medium">
                      Name updated!
                    </p>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={nameStatus === "loading"}
                      className={saveBtnCls}
                    >
                      {nameStatus === "loading" ? "Saving…" : "Save name"}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {activeSection === "password" && (
              <section className="bg-white dark:bg-[#1a1a1a] border border-[#ebebeb] dark:border-[#2a2a2a] rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-[#ebebeb] dark:border-[#2a2a2a]">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Password
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Choose a strong password, at least 8 characters.
                  </p>
                </div>
                <form
                  onSubmit={handleSavePassword}
                  className="px-6 py-5 space-y-3"
                >
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Current password
                    </label>
                    <input
                      type="password"
                      value={currentPw}
                      onChange={(e) => {
                        setCurrentPw(e.target.value);
                        setPwStatus("idle");
                      }}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      New password
                    </label>
                    <input
                      type="password"
                      value={newPw}
                      onChange={(e) => {
                        setNewPw(e.target.value);
                        setPwStatus("idle");
                      }}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Confirm new password
                    </label>
                    <input
                      type="password"
                      value={confirmPw}
                      onChange={(e) => {
                        setConfirmPw(e.target.value);
                        setPwStatus("idle");
                      }}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className={inputCls}
                    />
                  </div>

                  {pwError && <p className="text-xs text-red-500">{pwError}</p>}
                  {pwStatus === "success" && (
                    <p className="text-xs text-emerald-600 font-medium">
                      Password changed successfully!
                    </p>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={pwStatus === "loading"}
                      className={saveBtnCls}
                    >
                      {pwStatus === "loading" ? "Saving…" : "Change password"}
                    </button>
                  </div>
                </form>
              </section>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
