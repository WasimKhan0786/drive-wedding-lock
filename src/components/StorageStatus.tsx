"use client";

import { useEffect, useState } from "react";
import { getUsageAction } from "@/app/actions";
import { Database, AlertTriangle } from "lucide-react";

export default function StorageStatus() {
    const [usage, setUsage] = useState<any>(null);

    useEffect(() => {
        getUsageAction().then(res => {
            if (res.success) {
                setUsage(res.data);
            }
        });
    }, []);

    if (!usage) return null;

    const percent = usage.credits.used_percent;
    const isCrisis = percent > 80;

    return (
        <div className="glass-panel" style={{
            padding: '1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            border: isCrisis ? '1px solid #f44336' : '1px solid var(--glass-border)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: isCrisis ? '#f44336' : 'var(--primary-gold)' }}>
                <Database size={20} />
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Storage Status</h3>
            </div>
            
            <div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#ccc' }}>
                    <span>Used: {usage.credits.usage.toFixed(2)} Credits</span>
                    <span>Total: {usage.credits.limit} Credits</span>
                 </div>
                 <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                     <div style={{ 
                         width: `${Math.min(percent, 100)}%`, 
                         height: '100%', 
                         background: isCrisis ? '#f44336' : 'var(--primary-gold)',
                         transition: 'width 1s ease'
                     }} />
                 </div>
            </div>

            <div style={{ 
                background: 'rgba(255, 152, 0, 0.1)', 
                border: '1px solid rgba(255, 152, 0, 0.3)', 
                padding: '1rem', 
                borderRadius: '8px',
                fontSize: '0.9rem',
                color: '#ffb74d',
                display: 'flex',
                gap: '10px',
                alignItems: 'start'
            }}>
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ margin: 0, lineHeight: 1.4 }}>
                    <strong>Warning:</strong> Cloudinary Free Plan allows approx. 25 GB of total storage. 
                    Please ensure total uploads do not exceed <strong>25 Credits</strong>. 
                </p>
            </div>

            <div style={{ 
                background: 'rgba(74, 222, 128, 0.1)', 
                border: '1px solid rgba(74, 222, 128, 0.3)', 
                padding: '1rem', 
                borderRadius: '8px',
                fontSize: '0.9rem',
                color: '#4ade80',
                display: 'flex',
                gap: '10px',
                alignItems: 'start'
            }}>
                <Database size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ margin: 0, lineHeight: 1.4 }}>
                    <strong>Retention Policy:</strong> Videos are kept <strong>Forever</strong> as long as your account is active. 
                    They do not expire automatically unless you choose to delete them.
                </p>
            </div>
        </div>
    );
}
