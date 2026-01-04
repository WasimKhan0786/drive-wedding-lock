"use client";

import { useEffect, useState } from "react";
import { getUsageAction } from "@/app/actions";
import { Database, AlertTriangle } from "lucide-react";

export default function StorageStatus() {
    // YouTube Quota is fixed for free tier
    const dailyQuota = 10000;
    const uploadCost = 1600;
    
    // We can't easily check used quota without another API call that might cost quota itself,
    // so we just show the static limits info which is what the user wants.

    return (
        <div className="glass-panel" style={{
            padding: '1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            border: '1px solid var(--glass-border)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary-gold)' }}>
                <Database size={20} />
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Storage & Quota Status (YouTube)</h3>
            </div>
            
            <div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#ccc' }}>
                    <span>Daily Quota: {dailyQuota} Units</span>
                    <span>Cost Per Upload: {uploadCost} Units</span>
                 </div>
                 <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                     <div style={{ 
                         width: '20%', // Simply visual indicator
                         height: '100%', 
                         background: 'var(--primary-gold)',
                     }} />
                 </div>
                 <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                     (Reset daily at midnight Pacific Time)
                 </p>
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
                    <strong>Upload Limit:</strong> You can upload approximately <strong>6 videos per day</strong> with the free quota.
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
                    <strong>Retention Policy:</strong> Videos are stored on YouTube server <strong>Forever</strong>. 
                    They are "Unlisted" and only accessible via this portal unless deleted.
                </p>
            </div>
        </div>
    );
}
