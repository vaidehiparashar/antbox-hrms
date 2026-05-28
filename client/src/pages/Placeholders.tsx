
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center h-[70vh] text-center">
    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20 animate-pulse">
      <span className="text-primary text-xl font-bold">⚙️</span>
    </div>
    <h1 className="text-2xl font-heading font-bold text-white mb-2">{title}</h1>
    <p className="text-text-secondary text-sm max-w-sm">This module is under construction and will be integrated in the next release.</p>
  </div>
);

export const Departments = () => <PlaceholderPage title="Departments Directory" />;
export const Performance = () => <PlaceholderPage title="Performance Reviews" />;
export const Announcements = () => <PlaceholderPage title="Company Announcements" />;
export const Documents = () => <PlaceholderPage title="Document Management" />;
export const Settings = () => <PlaceholderPage title="System Settings" />;
