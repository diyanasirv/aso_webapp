import { useEffect, useState, useRef } from "react";
import { supabase, getUserWithRetry } from "../supabaseClient";

export default function OrderChat({ orderId, orderNumber, participantName, onClose }) {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [senderRole, setSenderRole] = useState("user");
    const listRef = useRef(null);

    useEffect(() => {
        if (!orderId) return;

        let mounted = true;

        async function loadRole() {
            try {
                const res = await getUserWithRetry();
                const { data: { user }, error: userError } = res;
                if (userError) {
                    console.error("Error fetching auth user:", userError);
                    return;
                }

                if (user) {
                    setCurrentUserId(user.id);

                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("role")
                        .eq("id", user.id)
                        .single();

                    if (profile?.role) {
                        setSenderRole(profile.role.toLowerCase() === "admin" ? "admin" : "user");
                    }
                }
            } catch (e) {
                console.error("Error loading role with retry:", e);
            }
        }

        async function load() {
            const { data, error } = await supabase
                .from("order_chats")
                .select("*")
                .eq("order_id", orderId)
                .order("created_at", { ascending: true });

            if (error) {
                console.error("Error loading chat:", error);
                return;
            }

            if (mounted) setMessages(data || []);
        }

        loadRole();
        load();

        const channelName = `order-chat-${orderId}`;
        const channel = supabase
            .channel(channelName)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "order_chats", filter: `order_id=eq.${orderId}` },
                (payload) => {
                    setMessages((prev) =>
                        prev.some((m) => m.id === payload.new.id) ? prev : [...prev, payload.new]
                    );
                }
            )
            .subscribe();

        return () => {
            mounted = false;
            supabase.removeChannel(channel);
        };
    }, [orderId]);

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages]);

    async function sendMessage() {
        if (!text.trim() || !orderId) return;
        setSending(true);

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            alert("You must be logged in to send messages.");
            setSending(false);
            return;
        }

        const payload = {
            order_id: orderId,
            order_number: orderNumber,
            sender_id: user.id,
            sender_role: senderRole,
            message: text.trim(),
        };

        try {
            await getUserWithRetry();
        } catch (e) {
            console.error("Auth getUser failed after retries:", e);
            alert("You must be logged in to send messages.");
            setSending(false);
            return;
        }

        const { data, error } = await supabase.from("order_chats").insert(payload).select("*");

        if (error) {
            alert(`Failed to send message: ${error.message}`);
            console.error("Order chat send error:", error);
        } else if (data?.length) {
            const inserted = data[0];
            setMessages((prev) =>
                prev.some((m) => m.id === inserted.id) ? prev : [...prev, inserted]
            );
            setText("");
        }

        setSending(false);
    }

    if (!orderId) return null;

    return (
        <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
            style={{
                zIndex: 9999,
                pointerEvents: "auto",
                background: "rgba(0,0,0,0.4)",
                padding: "10px",
            }}
        >
            <div
                className="bg-white rounded-3 shadow p-3"
                style={{
                    width: "100%",
                    maxWidth: "720px",
                    height: "80vh",
                    maxHeight: "80vh",
                    overflow: "hidden",
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-2 flex-shrink-0">
                    <div>
                        <h6 className="mb-0 fw-bold">
                            Chat — Order #{orderNumber}
                        </h6>
                        {participantName && (
                            <small className="text-muted">
                                Customer: {participantName}
                            </small>
                        )}
                    </div>
                    <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>

                {/* Message List area */}
                <div
                    ref={listRef}
                    className="border rounded p-3 mb-2 bg-light"
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        overflowX: "hidden",
                        width: "100%",
                    }}
                >
                    {messages.length === 0 ? (
                        <div className="text-muted text-center py-4">
                            No messages yet
                        </div>
                    ) : (
                        messages.map((m) => {
                            const isSystem = m.sender_role === "system";
                            const isMine = currentUserId && m.sender_id === currentUserId;

                            const containerClass = isSystem
                                ? "justify-content-center"
                                : isMine
                                    ? "justify-content-end"
                                    : "justify-content-start";

                            const bubbleClass = isSystem
                                ? "border border-2 text-dark bg-white"
                                : isMine
                                    ? "bg-primary text-white"
                                    : "bg-white text-dark border";

                            const bubbleStyle = {
                                maxWidth: isSystem ? "90%" : "75%",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                fontWeight: isSystem ? 600 : 400,
                                background: isSystem
                                    ? "linear-gradient(180deg, rgba(238,247,255,1) 0%, rgba(248,251,255,1) 100%)"
                                    : undefined,
                                borderColor: isSystem ? "#0d6efd" : undefined,
                                boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
                            };

                            const senderLabel = isSystem
                                ? "SYSTEM"
                                : isMine
                                    ? senderRole === "admin"
                                        ? "Admin"
                                        : "You"
                                    : m.sender_role === "admin"
                                        ? "Admin"
                                        : "User";

                            return (
                                <div
                                    key={m.id || Math.random()}
                                    className={`d-flex ${containerClass} mb-3 width-100`}
                                >
                                    <div
                                        className={`p-2 px-3 rounded-3 ${bubbleClass} d-flex flex-column`}
                                        style={bubbleStyle}
                                    >
                                        <div 
                                            className="mb-1 fw-bold" 
                                            style={{ 
                                                fontSize: "11px", 
                                                opacity: isMine ? 0.85 : 0.6,
                                                textAlign: isSystem ? "center" : "left" 
                                            }}
                                        >
                                            {senderLabel}
                                        </div>

                                        <div style={{ fontSize: "14px", lineHeight: "1.4" }}>
                                            {m.message}
                                        </div>

                                        <div 
                                            className="mt-1 text-end" 
                                            style={{ 
                                                fontSize: "10px", 
                                                opacity: isMine ? 0.75 : 0.5,
                                                minWidth: "100px"
                                            }}
                                        >
                                            {m.created_at
                                                ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : ""}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Input Controls */}
                <div
                    className="d-flex gap-2 pt-1 flex-shrink-0"
                    style={{
                        width: "100%",
                        alignItems: "center",
                    }}
                >
                    <input
                        className="form-control shadow-none"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type a message..."
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                sendMessage();
                            }
                        }}
                        style={{
                            flex: 1,
                            minWidth: 0,
                        }}
                    />

                    <button
                        className="btn btn-primary px-3"
                        onClick={sendMessage}
                        disabled={sending || !text.trim()}
                        style={{
                            flexShrink: 0,
                            whiteSpace: "nowrap",
                        }}
                    >
                        {sending ? "Sending..." : "Send"}
                    </button>
                </div>
            </div>
        </div>
    );
}