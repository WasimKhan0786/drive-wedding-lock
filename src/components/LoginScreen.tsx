"use client";

import { useTransition, useState } from "react";
import { loginAction } from "@/app/actions";
import { Lock, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginScreen() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        setError("");
        startTransition(async () => {
             const res = await loginAction(formData);
             if (res.success) {
                 router.refresh();
             } else {
                 setError(res.error || "Invalid credentials");
             }
        });
    };

    return (
        <div className="login-container">
            <div className="login-card glass-panel">
                <div className="icon-wrapper">
                    <Lock size={32} color="#D4AF37" />
                </div>
                
                <h1 className="title"><span className="animated-logo-text">Welcome Back</span></h1>
                <p className="subtitle">Please enter your credentials to access the memory portal.</p>

                <form onSubmit={handleSubmit} className="form">
                    <div className="input-group">
                        <label>Email Address</label>
                        <input 
                            name="email" 
                            type="email" 
                            placeholder="name@example.com" 
                            required 
                            defaultValue="wasimkham7861@gmail.com"
                        />
                    </div>
                    
                    <div className="input-group">
                        <label>Password</label>
                        <input 
                            name="password" 
                            type="password" 
                            placeholder="Enter password" 
                            required 
                        />
                    </div>

                    {error && <p className="error-msg">{error}</p>}

                    <button type="submit" disabled={isPending} className="btn-primary auth-btn">
                        {isPending ? <Loader2 className="animate-spin" /> : <>Unlock Portal <ArrowRight size={18} /></>}
                    </button>
                </form>
            </div>

            <style jsx global>{`
                .login-container {
                    position: fixed;
                    inset: 0;
                    background: radial-gradient(circle at center, #1a1a1a 0%, #000 100%);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                }
                .login-card {
                    width: 100%;
                    max-width: 400px;
                    padding: 2.5rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    animation: fadeInUp 0.5s ease-out;
                }
                .icon-wrapper {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: rgba(212, 175, 55, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 1.5rem;
                    border: 1px solid rgba(212, 175, 55, 0.3);
                    box-shadow: 0 0 20px rgba(212, 175, 55, 0.2);
                }
                .title {
                    font-size: 2rem;
                    color: #fff;
                    margin-bottom: 0.5rem;
                    font-family: var(--font-heading);
                }
                .subtitle {
                    color: #888;
                    text-align: center;
                    margin-bottom: 2rem;
                    font-size: 0.9rem;
                    line-height: 1.5;
                }
                .form {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    text-align: left;
                }
                .input-group label {
                    color: #ccc;
                    font-size: 0.85rem;
                    font-weight: 500;
                }
                .input-group input {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid var(--glass-border);
                    padding: 0.8rem 1rem;
                    border-radius: 8px;
                    color: #fff;
                    font-size: 1rem;
                    transition: all 0.3s;
                }
                .input-group input:focus {
                    outline: none;
                    border-color: var(--primary-gold);
                    background: rgba(255, 255, 255, 0.08);
                }
                .auth-btn {
                    margin-top: 1rem;
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                }
                .error-msg {
                    color: #ef4444;
                    font-size: 0.9rem;
                    text-align: center;
                    background: rgba(239, 68, 68, 0.1);
                    padding: 0.5rem;
                    borderRadius: 4px;
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
