import React, { useState } from 'react';
import { 
  X, User, ShieldCheck, Mail, Building2, Sparkles, 
  CheckCircle2, ArrowRight, LogOut, GraduationCap, 
  Briefcase, Compass, ChevronRight, RefreshCw
} from 'lucide-react';
import { AuthUser } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onLogin: (user: AuthUser) => void;
  onLogout: () => void;
}

const PRESET_PERSONAS: Array<{
  name: string;
  email: string;
  role: 'Lead Renewable Architect' | 'Financial Analyst' | 'GIS Specialist' | 'Academic Researcher';
  organization: string;
  description: string;
  iconType: 'engineer' | 'finance' | 'gis' | 'academic';
}> = [
  {
    name: 'Dr. Elena Vance',
    email: 'elena.vance@ecogrid.ai',
    role: 'Lead Renewable Architect',
    organization: 'EcoGrid Renewable Systems',
    description: 'Specializes in PV array sizing, aerodynamic wake modeling, and hybrid dispatch.',
    iconType: 'engineer'
  },
  {
    name: 'Marcus Brody',
    email: 'marcus.brody@cleanenergycap.com',
    role: 'Financial Analyst',
    organization: 'CleanEnergy Capital',
    description: 'Expert in LCOE sensitivity, tax equity (ITC/PTC), debt service, and NPV.',
    iconType: 'finance'
  },
  {
    name: 'Aisha Patel',
    email: 'aisha.patel@geospatialhorizons.org',
    role: 'GIS Specialist',
    organization: 'GeoSpatial Horizons',
    description: 'Focuses on slope constraints, satellite land-cover masking, and grid interconnection.',
    iconType: 'gis'
  },
  {
    name: 'Parmeet Singh',
    email: '124parmeet8025@sjcem.edu.in',
    role: 'Academic Researcher',
    organization: 'St. John College of Engineering & Management (SJCEM)',
    description: 'Academic modeling, renewable microgrids, and regional clean energy transition.',
    iconType: 'academic'
  }
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'credentials' | 'sso'>('quick');
  
  // Custom sign-in form state
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customOrg, setCustomOrg] = useState('');
  const [customRole, setCustomRole] = useState<'Lead Renewable Architect' | 'Financial Analyst' | 'GIS Specialist' | 'Academic Researcher'>('Lead Renewable Architect');
  
  // SSO form state
  const [ssoDomain, setSsoDomain] = useState('sjcem.edu.in');
  const [ssoRole, setSsoRole] = useState<'Lead Renewable Architect' | 'Financial Analyst' | 'GIS Specialist' | 'Academic Researcher'>('Academic Researcher');

  // Google interactive modal flow state
  const [googleStep, setGoogleStep] = useState<'prompt' | 'selectRole'>('prompt');
  const [googleEmail, setGoogleEmail] = useState('124parmeet8025@sjcem.edu.in');
  const [googleName, setGoogleName] = useState('Parmeet Singh');
  const [googleRole, setGoogleRole] = useState<'Lead Renewable Architect' | 'Financial Analyst' | 'GIS Specialist' | 'Academic Researcher'>('Lead Renewable Architect');

  if (!isOpen) return null;

  // Handle Preset Persona Login
  const handleSelectPersona = (persona: typeof PRESET_PERSONAS[0]) => {
    onLogin({
      id: `usr-${Date.now()}`,
      name: persona.name,
      email: persona.email,
      role: persona.role,
      organization: persona.organization,
      provider: 'demo'
    });
    onClose();
  };

  // Handle Google OAuth Simulation / Fast Connect
  const handleGoogleSignIn = () => {
    onLogin({
      id: `usr-google-${Date.now()}`,
      name: googleName || 'Google User',
      email: googleEmail || 'user@gmail.com',
      role: googleRole,
      organization: googleEmail.includes('sjcem.edu.in') ? 'SJCEM Engineering' : 'Google Cloud Partner',
      provider: 'google'
    });
    onClose();
  };

  // Handle Enterprise SSO Login
  const handleSsoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const domainPrefix = ssoDomain.split('@').pop() || 'enterprise.com';
    onLogin({
      id: `usr-sso-${Date.now()}`,
      name: `${ssoRole.split(' ')[0]} Specialist`,
      email: ssoDomain.includes('@') ? ssoDomain : `auth@${ssoDomain}`,
      role: ssoRole,
      organization: domainPrefix.toUpperCase().replace('.EDU.IN', ' Engineering').replace('.COM', ' Org'),
      provider: 'sso'
    });
    onClose();
  };

  // Handle Custom Email Registration/Login
  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({
      id: `usr-${Date.now()}`,
      name: customName || 'Renewable Analyst',
      email: customEmail || 'analyst@ecogrid.ai',
      role: customRole,
      organization: customOrg || 'Independent Planner',
      provider: 'credentials'
    });
    onClose();
  };

  // Render Provider Badge
  const renderProviderBadge = (provider?: string) => {
    if (provider === 'google') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-900 border border-slate-200">
          <GoogleIcon className="w-3 h-3" />
          Google Account
        </span>
      );
    }
    if (provider === 'sso') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-800">
          <Building2 className="w-3 h-3" />
          Institutional SSO
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
        <ShieldCheck className="w-3 h-3" />
        Verified Engineer
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#071a12] border border-[#1b4832] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#143826] flex items-center justify-between bg-[#04140d]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <User className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 font-['Plus_Jakarta_Sans']">
                {currentUser ? 'Active Engineering Session' : 'EcoGrid Identity & Access Portal'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {currentUser ? 'Manage role permissions and active identity' : 'Select your sign-in method or institutional role'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#0e2c1e] hover:bg-[#153e2b] text-slate-400 hover:text-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar space-y-5">
          {currentUser ? (
            /* ACTIVE SIGNED-IN PROFILE VIEW */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-b from-[#0a261a] to-[#071b12] border border-[#1b4832] space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-700/30 border border-emerald-500/40 flex items-center justify-center text-lg font-bold text-emerald-300 font-mono">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{currentUser.name}</span>
                        {renderProviderBadge(currentUser.provider)}
                      </div>
                      <div className="text-xs text-slate-300 font-mono mt-0.5">{currentUser.email}</div>
                      {currentUser.organization && (
                        <div className="text-[11px] text-emerald-400/90 font-medium flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-emerald-500" />
                          <span>{currentUser.organization}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#153a28] flex items-center justify-between text-xs">
                  <span className="text-slate-400">Assigned Platform Role:</span>
                  <span className="font-semibold text-emerald-300 bg-emerald-950/70 px-2.5 py-1 rounded-md border border-emerald-500/30">
                    {currentUser.role}
                  </span>
                </div>
              </div>

              {/* Permissions Breakdown */}
              <div className="p-3.5 rounded-xl bg-[#05170f] border border-[#143826] space-y-2">
                <div className="text-[11px] uppercase font-mono tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Role Authorization Matrix</span>
                  <span className="text-emerald-400 font-bold">Active</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>NASA POWER & ERA5 Data</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>Machine Learning ML Predictor</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>CAPEX / LCOE Financial Model</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>GIS Contours & Multi-Base Maps</span>
                  </div>
                </div>
              </div>

              {/* Quick Role Switcher */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-semibold text-slate-300">Quick-Switch Role for this Session</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Lead Renewable Architect', 'Financial Analyst', 'GIS Specialist', 'Academic Researcher'] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => {
                        onLogin({ ...currentUser, role: r });
                      }}
                      className={`px-2.5 py-2 rounded-lg text-left text-xs font-medium transition-all flex items-center justify-between ${
                        currentUser.role === r
                          ? 'bg-emerald-600/30 text-emerald-200 border border-emerald-500/50 shadow-sm'
                          : 'bg-[#0a2318] text-slate-400 hover:text-slate-200 border border-[#143b27]'
                      }`}
                    >
                      <span className="truncate">{r}</span>
                      {currentUser.role === r && <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0 ml-1" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sign Out Action */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => {
                    onLogout();
                  }}
                  className="flex-1 py-2 px-3 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out Session</span>
                </button>
                <button
                  onClick={onClose}
                  className="py-2 px-4 rounded-lg bg-[#0e2c1e] hover:bg-[#153e2b] text-slate-200 border border-[#1b4832] font-semibold text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* NOT SIGNED IN: PROVIDER TABS & CHOICES */
            <div className="space-y-4">
              {/* Method Selector Tabs */}
              <div className="flex rounded-xl bg-[#04140d] p-1 border border-[#143826]">
                <button
                  onClick={() => setActiveTab('quick')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'quick'
                      ? 'bg-emerald-600 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Google & Quick Access
                </button>
                <button
                  onClick={() => setActiveTab('sso')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'sso'
                      ? 'bg-emerald-600 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Institutional SSO
                </button>
                <button
                  onClick={() => setActiveTab('credentials')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'credentials'
                      ? 'bg-emerald-600 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Custom Profile
                </button>
              </div>

              {/* TAB 1: GOOGLE & QUICK ACCESS */}
              {activeTab === 'quick' && (
                <div className="space-y-4">
                  {/* Google Sign-in Card */}
                  <div className="p-4 rounded-xl bg-[#0a2318] border border-[#19452f] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GoogleIcon className="w-5 h-5" />
                        <span className="text-xs font-bold text-white">Google Workspace / Account</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                        1-Click Connect
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <span className="text-slate-400">Account:</span>
                        <span className="font-mono text-emerald-300 font-medium">124parmeet8025@sjcem.edu.in</span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <label className="block text-[11px] text-slate-400 mb-1">Select Role</label>
                          <select
                            value={googleRole}
                            onChange={(e: any) => setGoogleRole(e.target.value)}
                            className="w-full bg-[#05170f] border border-[#1b4330] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-emerald-500"
                          >
                            <option value="Lead Renewable Architect">Lead Renewable Architect</option>
                            <option value="Financial Analyst">Financial Analyst</option>
                            <option value="GIS Specialist">GIS Specialist</option>
                            <option value="Academic Researcher">Academic Researcher</option>
                          </select>
                        </div>
                        <button
                          onClick={handleGoogleSignIn}
                          className="mt-4 px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-md transition-all flex items-center gap-2 flex-shrink-0"
                        >
                          <GoogleIcon className="w-4 h-4" />
                          <span>Sign in with Google</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Section Divider */}
                  <div className="relative flex items-center justify-center">
                    <div className="border-t border-[#143826] w-full" />
                    <span className="bg-[#071a12] px-3 text-[10px] uppercase font-mono tracking-wider text-slate-500">
                      Or Choose a Pre-configured Role
                    </span>
                  </div>

                  {/* Pre-configured Engineering Personas Grid */}
                  <div className="space-y-2">
                    {PRESET_PERSONAS.map(persona => (
                      <div
                        key={persona.email}
                        onClick={() => handleSelectPersona(persona)}
                        className="p-3 rounded-xl bg-[#061e14] hover:bg-[#0a2a1c] border border-[#143b27] hover:border-emerald-500/50 cursor-pointer transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#0e2c1e] border border-[#1b4832] flex items-center justify-center text-emerald-400 flex-shrink-0">
                            {persona.iconType === 'engineer' && <Compass className="w-4 h-4" />}
                            {persona.iconType === 'finance' && <Briefcase className="w-4 h-4" />}
                            {persona.iconType === 'gis' && <Sparkles className="w-4 h-4" />}
                            {persona.iconType === 'academic' && <GraduationCap className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-300 transition-colors">
                                {persona.name}
                              </span>
                              <span className="text-[10px] font-semibold text-emerald-400/90 bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                {persona.role}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[280px]">
                              {persona.organization} &bull; {persona.email}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: INSTITUTIONAL SSO */}
              {activeTab === 'sso' && (
                <form onSubmit={handleSsoSubmit} className="space-y-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#092217] border border-[#16402c] space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <Building2 className="w-4 h-4" />
                      <span>Enterprise / Institutional Single Sign-On</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Authenticate through your organization’s identity federation (SAML 2.0 / OpenID Connect / University Portal).
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Institutional Email or Domain</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={ssoDomain}
                        onChange={(e) => setSsoDomain(e.target.value)}
                        placeholder="e.g. 124parmeet8025@sjcem.edu.in or sjcem.edu.in"
                        className="w-full bg-[#0b2419] border border-[#1b4330] rounded-lg pl-9 pr-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                        required
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Assigned Organizational Role</label>
                    <select
                      value={ssoRole}
                      onChange={(e: any) => setSsoRole(e.target.value)}
                      className="w-full bg-[#0b2419] border border-[#1b4330] rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                    >
                      <option value="Academic Researcher">Academic Researcher</option>
                      <option value="Lead Renewable Architect">Lead Renewable Architect</option>
                      <option value="Financial Analyst">Financial Analyst</option>
                      <option value="GIS Specialist">GIS Specialist</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <span>Authenticate via SSO Federation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}

              {/* TAB 3: CUSTOM PROFILE CREATION */}
              {activeTab === 'credentials' && (
                <form onSubmit={handleCustomSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="e.g. Elena Vance, PE"
                      className="w-full bg-[#0b2419] border border-[#1b4330] rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Professional Email</label>
                    <input
                      type="email"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder="e.g. elena@cleanenergy.com"
                      className="w-full bg-[#0b2419] border border-[#1b4330] rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Organization / Institution (Optional)</label>
                    <input
                      type="text"
                      value={customOrg}
                      onChange={(e) => setCustomOrg(e.target.value)}
                      placeholder="e.g. SJCEM / National Renewable Lab"
                      className="w-full bg-[#0b2419] border border-[#1b4330] rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Engineering Specialization</label>
                    <select
                      value={customRole}
                      onChange={(e: any) => setCustomRole(e.target.value)}
                      className="w-full bg-[#0b2419] border border-[#1b4330] rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                    >
                      <option value="Lead Renewable Architect">Lead Renewable Architect</option>
                      <option value="Financial Analyst">Financial Analyst</option>
                      <option value="GIS Specialist">GIS Specialist</option>
                      <option value="Academic Researcher">Academic Researcher</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-md transition-all mt-2"
                  >
                    Create & Enter Platform Workspace
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// SVG Google Logo Icon
const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);
