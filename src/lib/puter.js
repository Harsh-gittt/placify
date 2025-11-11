import { create } from "zustand";

const getPuter = () =>
  typeof window !== "undefined" && window.puter ? window.puter : null;

export const usePuterStore = create((set, get) => {
  const setError = (msg) => {
    set({ error: msg, isLoading: false });
  };

  const checkAuthStatus = async () => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return false;
    }

    set({ isLoading: true, error: null });

    try {
      const isSignedIn = await puter.auth.isSignedIn();
      if (isSignedIn) {
        const user = await puter.auth.getUser();
        set({ auth: { user, isAuthenticated: true }, isLoading: false });
        return true;
      } else {
        set({ auth: { user: null, isAuthenticated: false }, isLoading: false });
        return false;
      }
    } catch (err) {
      setError(err?.message || "Failed to check auth status");
      return false;
    }
  };

  const signIn = async () => {
    const puter = getPuter();
    if (!puter) return setError("Puter.js not available");
    set({ isLoading: true, error: null });
    try {
      await puter.auth.signIn();
      await checkAuthStatus();
    } catch (err) {
      setError(err?.message || "Sign in failed");
    }
  };

  const signOut = async () => {
    const puter = getPuter();
    if (!puter) return setError("Puter.js not available");
    set({ isLoading: true, error: null });
    try {
      await puter.auth.signOut();
      set({ auth: { user: null, isAuthenticated: false }, isLoading: false });
    } catch (err) {
      setError(err?.message || "Sign out failed");
    }
  };

  const init = () => {
    // Check if Puter script is loaded
    if (typeof window === "undefined") return;
    
    // Wait for Puter script to load
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
      return;
    }

    const puter = getPuter();
    if (puter) {
      set({ puterReady: true, isLoading: false });
      // Don't require authentication - check auth status in background but don't block
      checkAuthStatus().catch(() => {
        // If auth check fails, continue anyway - Puter can work without auth
        set({ isLoading: false });
      });
      return;
    }

    // Wait for Puter to load
    let attempts = 0;
    const maxAttempts = 100; // 10 seconds
    
    const interval = setInterval(() => {
      attempts++;
      const puter = getPuter();
      if (puter) {
        clearInterval(interval);
        set({ puterReady: true, isLoading: false });
        // Don't require authentication - check auth status in background but don't block
        checkAuthStatus().catch(() => {
          // If auth check fails, continue anyway - Puter can work without auth
          set({ isLoading: false });
        });
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        setError("Puter.js failed to load. Please refresh the page.");
        set({ isLoading: false });
      }
    }, 100);
  };

  const write = async (path, data) => {
    const puter = getPuter();
    if (!puter) return setError("Puter.js not available");
    return puter.fs.write(path, data);
  };

  const read = async (path) => {
    const puter = getPuter();
    if (!puter) return setError("Puter.js not available");
    return puter.fs.read(path);
  };

  const upload = async (files) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return null;
    }
    try {
      // Check if signed in, if not try to sign in automatically
      const isSignedIn = await puter.auth.isSignedIn();
      if (!isSignedIn) {
        try {
          await puter.auth.signIn();
        } catch (authErr) {
          // If auto sign-in fails, try the operation anyway
          console.warn("Auto sign-in failed, trying operation:", authErr);
        }
      }
      return await puter.fs.upload(files);
    } catch (err) {
      const errorMsg = err?.message || "Failed to upload file";
      setError(errorMsg);
      console.error("Upload error:", err);
      return null;
    }
  };

  const aiChat = async (prompt, imageURL, testMode, options) => {
    const puter = getPuter();
    if (!puter) return setError("Puter.js not available");
    return puter.ai.chat(prompt, imageURL, testMode, options);
  };

  const feedback = async (path, message) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return null;
    }
    try {
      // Check if signed in, if not try to sign in automatically
      const isSignedIn = await puter.auth.isSignedIn();
      if (!isSignedIn) {
        try {
          await puter.auth.signIn();
        } catch (authErr) {
          // If auto sign-in fails, try the operation anyway
          console.warn("Auto sign-in failed, trying operation:", authErr);
        }
      }
      return await puter.ai.chat(
        [
          {
            role: "user",
            content: [
              { type: "file", puter_path: path },
              { type: "text", text: message },
            ],
          },
        ],
        { model: "claude-3-7-sonnet" }
      );
    } catch (err) {
      const errorMsg = err?.message || "Failed to analyze resume";
      setError(errorMsg);
      console.error("Feedback error:", err);
      return null;
    }
  };

  const kvGet = async (key) => {
    const puter = getPuter();
    if (!puter) return setError("Puter.js not available");
    return puter.kv.get(key);
  };

  const kvSet = async (key, value) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return false;
    }
    try {
      // Check if signed in, if not try to sign in automatically
      const isSignedIn = await puter.auth.isSignedIn();
      if (!isSignedIn) {
        try {
          await puter.auth.signIn();
        } catch (authErr) {
          // If auto sign-in fails, try the operation anyway
          console.warn("Auto sign-in failed, trying operation:", authErr);
        }
      }
      return await puter.kv.set(key, value);
    } catch (err) {
      const errorMsg = err?.message || "Failed to save data";
      setError(errorMsg);
      console.error("KV set error:", err);
      return false;
    }
  };

  const kvList = async (pattern, returnValues) => {
    const puter = getPuter();
    if (!puter) return setError("Puter.js not available");
    return puter.kv.list(pattern, returnValues);
  };

  return {
    isLoading: true,
    error: null,
    puterReady: false,
    auth: {
      user: null,
      isAuthenticated: false,
      signIn,
      signOut,
      refreshUser: checkAuthStatus,
    },
    fs: {
      write,
      read,
      upload,
      delete: async (p) => {
        const puter = getPuter();
        if (!puter) return setError("Puter.js not available");
        return puter.fs.delete(p);
      },
      readdir: async (p) => {
        const puter = getPuter();
        if (!puter) return setError("Puter.js not available");
        return puter.fs.readdir(p);
      },
    },
    ai: {
      chat: aiChat,
      feedback,
      img2txt: async (image, testMode) => {
        const puter = getPuter();
        if (!puter) return setError("Puter.js not available");
        return puter.ai.img2txt(image, testMode);
      },
    },
    kv: {
      get: kvGet,
      set: kvSet,
      delete: async (k) => {
        const puter = getPuter();
        if (!puter) return setError("Puter.js not available");
        return puter.kv.delete(k);
      },
      list: kvList,
      flush: async () => {
        const puter = getPuter();
        if (!puter) return setError("Puter.js not available");
        return puter.kv.flush();
      },
    },
    init,
    clearError: () => set({ error: null }),
  };
});

export default usePuterStore;
