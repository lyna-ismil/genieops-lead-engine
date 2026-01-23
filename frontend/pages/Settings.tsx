import React from 'react';
import Layout from '../components/Layout';
import { Bell, Palette, ShieldCheck } from 'lucide-react';
import GenieCard from '../components/ui/GenieCard';
import GenieButton from '../components/ui/GenieButton';

const SettingsPage: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 pb-10">
        <div>
          <div className="genie-section-number">01.</div>
          <h1 className="text-3xl font-semibold mb-2">Settings</h1>
          <p className="text-lg genie-muted">Manage preferences for notifications, appearance, and security.</p>
        </div>

        <div className="space-y-6">
          <GenieCard>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-green-400">
              <Bell size={18} /> Notifications
            </h3>
            <div className="space-y-3 text-sm genie-muted">
              <label className="flex items-center gap-3">
                <input type="checkbox" className="h-4 w-4" defaultChecked />
                Campaign completion alerts
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="h-4 w-4" defaultChecked />
                Lead submission summaries
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="h-4 w-4" />
                Weekly performance digest
              </label>
            </div>
          </GenieCard>

          <GenieCard>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-green-400">
              <Palette size={18} /> Appearance
            </h3>
            <div className="text-sm genie-muted space-y-3">
              <label className="flex items-center gap-3">
                <input type="checkbox" className="h-4 w-4" />
                Compact sidebar
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="h-4 w-4" defaultChecked />
                Show onboarding tips
              </label>
            </div>
          </GenieCard>

          <GenieCard>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-green-400">
              <ShieldCheck size={18} /> Security
            </h3>
            <div className="text-sm genie-muted space-y-2">
              <p>Two-factor authentication is coming soon.</p>
              <GenieButton variant="secondary" className="mt-2">
                Reset sessions
              </GenieButton>
            </div>
          </GenieCard>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
