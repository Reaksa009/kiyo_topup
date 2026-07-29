import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { apiClient } from '../../api/client';
import { Settings, Save, AlertCircle, ShieldCheck } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [form, setForm] = useState<any>({
    platformName: 'KIYO TOPUP',
    contactEmail: 'support@kiyotopup.com',
    contactTelegram: '@VReaksa',
    maintenanceMode: false,
    abaPayWayMerchantId: '',
    abaPayWayApiKey: '',
    bakongMerchantName: 'KIYO TOPUP STORE',
    bakongMerchantId: '',
    bakongAccountId: '',
    bakongApiToken: '',
    g2bulkApiUrl: 'https://api.g2bulk.com/v1',
    g2bulkApiKey: '',
    g2bulkApiSecret: '',
    telegramBotToken: '',
    telegramChatId: ''
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiClient.get('/settings');
        if (res.data.data) {
          setForm((prev: any) => ({ ...prev, ...res.data.data }));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.put('/settings', form);
      alert('Platform settings updated successfully!');
    } catch (err: any) {
      alert('Error updating settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white">Platform Configurations & Gateways</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* General Settings */}
          <div className="glass-panel p-6 rounded-3xl space-y-4 border border-gray-800">
            <h3 className="text-base font-bold text-cyan-400 border-b border-gray-800 pb-2">General Platform Configs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="block text-gray-300 font-bold">Platform Name</label>
                <input
                  type="text"
                  value={form.platformName}
                  onChange={(e) => setForm({ ...form, platformName: e.target.value })}
                  className="w-full bg-[#111625] border border-gray-700 rounded-xl px-4 py-2.5 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-gray-300 font-bold">Support Email</label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  className="w-full bg-[#111625] border border-gray-700 rounded-xl px-4 py-2.5 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-gray-300 font-bold">Maintenance Mode</label>
                <select
                  value={form.maintenanceMode ? 'true' : 'false'}
                  onChange={(e) => setForm({ ...form, maintenanceMode: e.target.value === 'true' })}
                  className="w-full bg-[#111625] border border-gray-700 rounded-xl px-4 py-2.5 text-white"
                >
                  <option value="false">Disabled (Platform Online)</option>
                  <option value="true">Enabled (Maintenance Lock)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment Gateways Config */}
          <div className="glass-panel p-6 rounded-3xl space-y-4 border border-gray-800">
            <h3 className="text-base font-bold text-purple-400 border-b border-gray-800 pb-2">Payment Gateway Keys</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              
              <div className="space-y-1">
                <label className="block text-gray-300 font-bold">ABA PayWay Merchant ID</label>
                <input
                  type="text"
                  value={form.abaPayWayMerchantId}
                  onChange={(e) => setForm({ ...form, abaPayWayMerchantId: e.target.value })}
                  className="w-full bg-[#111625] border border-gray-700 rounded-xl px-4 py-2.5 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-gray-300 font-bold">ABA PayWay API Secret Key</label>
                <input
                  type="password"
                  value={form.abaPayWayApiKey}
                  onChange={(e) => setForm({ ...form, abaPayWayApiKey: e.target.value })}
                  className="w-full bg-[#111625] border border-gray-700 rounded-xl px-4 py-2.5 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-gray-300 font-bold">Bakong Account ID</label>
                <input
                  type="text"
                  value={form.bakongAccountId}
                  onChange={(e) => setForm({ ...form, bakongAccountId: e.target.value })}
                  placeholder="kiyo@acleda"
                  className="w-full bg-[#111625] border border-gray-700 rounded-xl px-4 py-2.5 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-gray-300 font-bold">Bakong Open API Token</label>
                <input
                  type="password"
                  value={form.bakongApiToken}
                  onChange={(e) => setForm({ ...form, bakongApiToken: e.target.value })}
                  className="w-full bg-[#111625] border border-gray-700 rounded-xl px-4 py-2.5 text-white font-mono"
                />
              </div>

            </div>
          </div>

          {/* G2Bulk Provider Credentials */}
          <div className="glass-panel p-6 rounded-3xl space-y-4 border border-gray-800">
            <h3 className="text-base font-bold text-amber-400 border-b border-gray-800 pb-2">G2Bulk Automated Top-Up Provider API Credentials</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              
              <div className="space-y-1">
                <label className="block text-gray-300 font-bold">G2Bulk API Key</label>
                <input
                  type="text"
                  value={form.g2bulkApiKey}
                  onChange={(e) => setForm({ ...form, g2bulkApiKey: e.target.value })}
                  className="w-full bg-[#111625] border border-gray-700 rounded-xl px-4 py-2.5 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-gray-300 font-bold">G2Bulk API Secret</label>
                <input
                  type="password"
                  value={form.g2bulkApiSecret}
                  onChange={(e) => setForm({ ...form, g2bulkApiSecret: e.target.value })}
                  className="w-full bg-[#111625] border border-gray-700 rounded-xl px-4 py-2.5 text-white font-mono"
                />
              </div>

            </div>
          </div>

          {/* Telegram Bot Config */}
          <div className="glass-panel p-6 rounded-3xl space-y-4 border border-gray-800">
            <h3 className="text-base font-bold text-pink-400 border-b border-gray-800 pb-2">Telegram Bot Real-Time Alerts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="block text-gray-300 font-bold">Telegram Bot Token</label>
                <input
                  type="text"
                  value={form.telegramBotToken}
                  onChange={(e) => setForm({ ...form, telegramBotToken: e.target.value })}
                  placeholder="123456:ABC-DEF..."
                  className="w-full bg-[#111625] border border-gray-700 rounded-xl px-4 py-2.5 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-gray-300 font-bold">Telegram Chat / Channel ID</label>
                <input
                  type="text"
                  value={form.telegramChatId}
                  onChange={(e) => setForm({ ...form, telegramChatId: e.target.value })}
                  placeholder="-100123456789"
                  className="w-full bg-[#111625] border border-gray-700 rounded-xl px-4 py-2.5 text-white font-mono"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase text-xs rounded-2xl shadow-xl glow-cyan flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Configs...' : 'Save All Settings'}</span>
          </button>

        </form>

      </div>
    </AdminLayout>
  );
};
