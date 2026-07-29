import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { apiClient } from '../../api/client';
import { ShieldCheck, Plus, Check } from 'lucide-react';

export const AdminRBAC: React.FC = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await apiClient.get('/admin/roles');
        setRoles(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white">Role-Based Access Control (RBAC) Matrix</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((r) => (
            <div key={r._id} className="glass-panel p-6 rounded-3xl space-y-4 border border-purple-500/20">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{r.name}</h3>
                    <p className="text-xs text-gray-400">{r.description}</p>
                  </div>
                </div>
                {r.isSystem && (
                  <span className="text-[10px] font-bold uppercase bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded">
                    SYSTEM ROLE
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Granted Permissions</h4>
                <div className="flex flex-wrap gap-2">
                  {r.permissions.map((p: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center space-x-1 text-[11px] font-mono font-bold bg-gray-800 text-purple-300 px-2.5 py-1 rounded-lg border border-purple-500/30">
                      <Check className="w-3 h-3 text-cyan-400" />
                      <span>{p}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </AdminLayout>
  );
};
