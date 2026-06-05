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
        // scroll to bottom
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages]);

    // use shared getUserWithRetry from supabaseClient

    async function sendMessage() {
        if (!text.trim() || !orderId) return;
        setSending(true);

        const {
            data: { user },
            error: userError,
        } = await getUserWithRetry();

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
            className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-end"
            style={{ zIndex: 9999, pointerEvents: "auto" }}
        >
            <div className="bg-white rounded shadow p-3" style={{ width: "100%", maxWidth: 720, maxHeight: "80vh" }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                        <h6 className="mb-0">Chat — Order #{orderNumber}</h6>
                        {participantName && (
                            <small className="text-muted">Customer: {participantName}</small>
                        )}
                    </div>
                    <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>Close</button>
                </div>

                <div ref={listRef} className="border rounded p-2 mb-2" style={{ height: 360, overflowY: "auto" }}>
                    {messages.length === 0 ? (
                        <div className="text-muted">No messages yet</div>
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
                                ? "border border-2 text-dark"
                                : isMine
                                    ? "bg-primary text-white"
                                    : "bg-light text-dark";
                            const bubbleStyle = {
                                maxWidth: "85%",
                                whiteSpace: "pre-wrap",
                                fontWeight: isSystem ? 600 : 400,
                                textAlign: isSystem ? "center" : "left",
                                background: isSystem
                                    ? "linear-gradient(180deg, rgba(238,247,255,1) 0%, rgba(248,251,255,1) 100%)"
                                    : undefined,
                                borderColor: isSystem ? "#0d6efd" : undefined,
                                boxShadow: isSystem ? "0 16px 40px rgba(13, 110, 253, 0.12)" : "none",
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
                                <div key={m.id || Math.random()} className={`d-flex ${containerClass} mb-2`}>
                                    <div
                                        className={`p-3 rounded-4 ${bubbleClass}`}
                                        style={bubbleStyle}
                                    >
                                        <div className="small text-muted mb-2">{senderLabel}</div>
                                        <div>{m.message}</div>
                                        <div className="small text-muted mt-2">{m.created_at ? new Date(m.created_at).toLocaleString() : ""}</div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="d-flex gap-2">
                    <input
                        className="form-control"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type a message..."
                        onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
                    />
                    <button className="btn btn-primary" onClick={sendMessage} disabled={sending || !text.trim()}>{sending ? 'Sending...' : 'Send'}</button>
                </div>
            </div>
        </div>
    );
}
