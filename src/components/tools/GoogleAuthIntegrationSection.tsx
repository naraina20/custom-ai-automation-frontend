'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useGoogleLogin, useGoogleOAuth } from '@react-oauth/google';
import { apiClient } from '@/lib/api-client';
import { GooglePickerDoc } from '@/lib/types';
import { isProductGranted } from './GoogleOAuthConsentButton';
import { GoogleDrivePicker } from './GoogleDrivePicker';
import {
  GOOGLE_PRODUCTS_MAP,
  getGoogleProductDefinition,
  normalizeGoogleProductKey,
  GoogleProductDefinition,
} from '@/config/googleProducts';
import { appToast } from '@/lib/toast';
import {
  Mail,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Building2,
  Loader2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Check,
} from 'lucide-react';

export type GmailAuthMode = 'company_email' | 'oauth' | 'app_password';

export interface GoogleAuthIntegrationSectionProps {
  userId: string;
  // Dynamic universal products array
  products?: string[];
  // Custom icon URLs override map (productId -> image/svg URL)
  customIconUrls?: Record<string, string>;

  // Gmail delivery state
  emailChoice?: GmailAuthMode;
  setEmailChoice?: (val: GmailAuthMode) => void;
  appEmail?: string;
  setAppEmail?: (val: string) => void;
  appPassword?: string;
  setAppPassword?: (val: string) => void;

  // Drive Picker state
  drivePickerEnabled?: boolean;
  setDrivePickerEnabled?: (val: boolean) => void;
  pickedGoogleFile?: GooglePickerDoc | null;
  setPickedGoogleFile?: (file: GooglePickerDoc | null) => void;
  drivePickerMimeTypes?: string;

  // Generic toggles map for other products: productId -> boolean
  enabledProducts?: Record<string, boolean>;
  setEnabledProducts?: (val: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;

  // Visibility flags (if not specifying products array)
  showGmailSection?: boolean;
  showDriveSection?: boolean;

  onAuthValidityChange?: (isValid: boolean) => void;
  className?: string;
}

export function GoogleAuthIntegrationSection({
  userId,
  products,
  customIconUrls = {},
  // Gmail states (defaulting to company_email if nothing is selected)
  emailChoice = 'company_email',
  setEmailChoice,
  appEmail = '',
  setAppEmail,
  appPassword = '',
  setAppPassword,
  // Drive Picker states
  drivePickerEnabled = true,
  setDrivePickerEnabled,
  pickedGoogleFile = null,
  setPickedGoogleFile,
  drivePickerMimeTypes = 'application/vnd.google-apps.spreadsheet',
  // Generic products toggle map
  enabledProducts = {},
  setEnabledProducts,
  showGmailSection = true,
  showDriveSection = true,
  onAuthValidityChange,
  className = '',
}: GoogleAuthIntegrationSectionProps) {
  const { clientId } = useGoogleOAuth();
  const isClientIdConfigured = Boolean(clientId && clientId !== 'google-oauth-unconfigured');

  const [isChecking, setIsChecking] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string>('');
  const [grantedScopes, setGrantedScopes] = useState<string[]>([]);
  const [grantedProducts, setGrantedProducts] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync user status from backend
  const checkStatus = useCallback(async () => {
    if (!userId || userId === 'guest_user') {
      setIsChecking(false);
      return;
    }
    try {
      const res = await apiClient.getGoogleOAuthStatus(userId);
      setIsConnected(res.connected);
      setGrantedScopes(res.granted_scopes || []);
      setGrantedProducts(res.granted_products || []);
      if (res.connected && res.email) {
        setAccountEmail(res.email);
      } else {
        setAccountEmail('');
      }
    } catch (err: any) {
      console.warn('Could not verify Google OAuth status:', err);
    } finally {
      setIsChecking(false);
    }
  }, [userId]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Determine active product keys
  const resolvedProductKeys = useMemo(() => {
    if (products && Array.isArray(products) && products.length > 0) {
      return Array.from(new Set(products.map(normalizeGoogleProductKey).filter(Boolean)));
    }
    const list: string[] = [];
    if (showGmailSection) list.push('gmail');
    if (showDriveSection) list.push('drive_picker');
    return list;
  }, [products, showGmailSection, showDriveSection]);

  const hasGmail = resolvedProductKeys.includes('gmail');
  const otherProductKeys = resolvedProductKeys.filter((k) => k !== 'gmail');

  // Helper to render icon for a product (uses custom URL if provided, else official SVG)
  const renderProductIcon = (def: GoogleProductDefinition, iconClass = 'w-5 h-5') => {
    const customUrl = customIconUrls[def.id] || def.iconUrl;
    if (customUrl) {
      return (
        <img
          src={customUrl}
          alt={def.name}
          className={`${iconClass} object-contain rounded shrink-0`}
        />
      );
    }
    const IconComponent = def.icon;
    return <IconComponent className={iconClass} />;
  };

  // Check product verification status
  const isProductVerified = useCallback(
    (productKey: string) => {
      return isProductGranted(productKey, grantedProducts, grantedScopes);
    },
    [grantedProducts, grantedScopes]
  );

  // Determine which products currently seek OAuth permissions
  const missingOAuthProducts = useMemo(() => {
    const missing: GoogleProductDefinition[] = [];

    // 1. Gmail: ONLY requires OAuth if user explicitly selected direct OAuth
    if (hasGmail && emailChoice === 'oauth') {
      if (!isProductVerified('gmail')) {
        missing.push(getGoogleProductDefinition('gmail'));
      }
    }

    // 2. Loop through all other products seeking permissions
    otherProductKeys.forEach((key) => {
      const isEnabled = key === 'drive_picker' ? drivePickerEnabled : (enabledProducts[key] ?? true);
      if (isEnabled && !isProductVerified(key)) {
        missing.push(getGoogleProductDefinition(key));
      }
    });

    return missing;
  }, [hasGmail, emailChoice, isProductVerified, otherProductKeys, drivePickerEnabled, enabledProducts]);

  // Dynamic scope construction: ONLY request scopes for products not already granted
  const dynamicScope = useMemo(() => {
    const scopes = ['https://www.googleapis.com/auth/userinfo.email', 'openid'];
    missingOAuthProducts.forEach((p) => {
      if (p.scope) scopes.push(p.scope);
    });
    return Array.from(new Set(scopes)).join(' ');
  }, [missingOAuthProducts]);

  const needsVerification = missingOAuthProducts.length > 0;

  // Compute overall auth validity
  const isAuthValid = useMemo(() => {
    // 1. Gmail validation:
    // If company_email (Default): always valid without OAuth!
    // If oauth: must have gmail verified.
    // If app_password: must have email & password non-empty.
    if (hasGmail) {
      if (emailChoice === 'oauth' && !isProductVerified('gmail')) return false;
      if (emailChoice === 'app_password' && (!appEmail.trim() || !appPassword.trim())) return false;
    }

    // 2. Other products validation:
    for (const key of otherProductKeys) {
      const isEnabled = key === 'drive_picker' ? drivePickerEnabled : (enabledProducts[key] ?? true);
      if (isEnabled) {
        if (!isProductVerified(key)) return false;
        if (key === 'drive_picker' && !pickedGoogleFile) return false;
      }
    }

    return true;
  }, [
    hasGmail,
    emailChoice,
    isProductVerified,
    appEmail,
    appPassword,
    otherProductKeys,
    drivePickerEnabled,
    enabledProducts,
    pickedGoogleFile,
  ]);

  useEffect(() => {
    if (onAuthValidityChange) {
      onAuthValidityChange(isAuthValid);
    }
  }, [isAuthValid, onAuthValidityChange]);

  // Google OAuth Login Trigger
  const googleLogin = useGoogleLogin({
    flow: 'auth-code',
    scope: dynamicScope,
    onSuccess: async (codeResponse) => {
      setIsConnecting(true);
      setErrorMessage(null);
      try {
        const exchangeRes = await apiClient.exchangeGoogleAuthCode(userId, codeResponse.code);
        if (exchangeRes.success) {
          setIsConnected(true);
          const email = exchangeRes.email || '';
          setAccountEmail(email);
          setGrantedScopes(exchangeRes.granted_scopes || []);
          setGrantedProducts(exchangeRes.granted_products || []);

          appToast.success('Google Permissions Verified', {
            description: `Successfully authorized permissions for ${email}.`,
          });
        } else {
          const err = exchangeRes.error || 'Failed to complete Google authorization.';
          setErrorMessage(err);
          appToast.error('Verification Failed', { description: err });
        }
      } catch (err: any) {
        const msg = err.message || 'Error exchanging authorization code with backend.';
        setErrorMessage(msg);
        appToast.error('Authorization Error', { description: msg });
      } finally {
        setIsConnecting(false);
      }
    },
    onError: (errorResponse) => {
      setIsConnecting(false);
      if (errorResponse.error && errorResponse.error !== 'access_denied') {
        const msg = errorResponse.error_description || errorResponse.error;
        setErrorMessage(msg);
        appToast.error('Google Sign-In Error', { description: msg });
      }
    },
    onNonOAuthError: (nonOAuthError) => {
      setIsConnecting(false);
      if (nonOAuthError.type === 'popup_failed_to_open') {
        const msg = 'Google consent popup was blocked by browser. Please allow popups and try again.';
        setErrorMessage(msg);
        appToast.warning('Popup Blocked', { description: msg });
      }
    },
  });

  const handleStartVerification = () => {
    setErrorMessage(null);
    setIsConnecting(true);
    try {
      googleLogin();
    } catch (err: any) {
      setIsConnecting(false);
      setErrorMessage(err.message || 'Failed to launch Google consent window.');
    }
  };

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Configuration Missing Alert */}
      {!isClientIdConfigured && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-semibold text-amber-200 block">Google Client ID Missing</span>
            <p className="text-amber-300/80 leading-relaxed text-[11px]">
              Set <code className="px-1 py-0.5 rounded bg-black/40 font-mono text-amber-300">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> in{' '}
              <code className="px-1 py-0.5 rounded bg-black/40 font-mono text-amber-300">frontend/.env.local</code> to enable Google OAuth.
            </p>
          </div>
        </div>
      )}

      {/* 1. SECTION: GMAIL OUTBOUND DELIVERY */}
      {hasGmail && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              {renderProductIcon(getGoogleProductDefinition('gmail'), 'w-4 h-4')}
              <span>Email Delivery & Authentication</span>
            </h4>
            {emailChoice === 'company_email' ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Check className="w-3 h-3 text-indigo-400" />
                <span>Default Ready</span>
              </span>
            ) : emailChoice === 'oauth' && isProductVerified('gmail') ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Verified</span>
              </span>
            ) : null}
          </div>
          <p className="text-[11px] text-slate-400">
            Choose how this automation sends outgoing emails (welcome notes, alerts, reports):
          </p>

          <div className="grid grid-cols-1 gap-2.5">
            {/* Option 1: Company Email (Default Behaviour) */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                emailChoice === 'company_email'
                  ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500'
                  : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="gmailAuthChoice"
                value="company_email"
                checked={emailChoice === 'company_email'}
                onChange={() => setEmailChoice && setEmailChoice('company_email')}
                className="mt-0.5 text-indigo-600 focus:ring-0 bg-slate-900 border-slate-700"
              />
              <div className="w-full">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Company Email (Default)</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    Recommended
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block mt-0.5 leading-relaxed">
                  Sends emails automatically through company infrastructure using your deployer identity (<code className="text-indigo-300 font-mono">deployer_data</code>). No personal OAuth consent screen or password required.
                </span>
              </div>
            </label>

            {/* Option 2: Direct Google OAuth */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                emailChoice === 'oauth'
                  ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500'
                  : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="gmailAuthChoice"
                value="oauth"
                checked={emailChoice === 'oauth'}
                onChange={() => setEmailChoice && setEmailChoice('oauth')}
                className="mt-0.5 text-indigo-600 focus:ring-0 bg-slate-900 border-slate-700"
              />
              <div className="w-full">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    {renderProductIcon(getGoogleProductDefinition('gmail'), 'w-3.5 h-3.5')}
                    <span>Direct Google OAuth (Personal Gmail)</span>
                  </span>
                  {isProductVerified('gmail') && (
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{accountEmail || 'Connected'}</span>
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 block mt-0.5 leading-relaxed">
                  Sends emails directly from your personal Gmail address using official Google OAuth consent (<code className="text-indigo-300 font-mono">gmail.send</code>).
                </span>
              </div>
            </label>

            {/* Option 3: App Password */}
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                emailChoice === 'app_password'
                  ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500'
                  : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="gmailAuthChoice"
                  value="app_password"
                  checked={emailChoice === 'app_password'}
                  onChange={() => setEmailChoice && setEmailChoice('app_password')}
                  className="mt-0.5 text-indigo-600 focus:ring-0 bg-slate-900 border-slate-700"
                />
                <div className="w-full">
                  <span className="text-xs font-semibold text-white block">
                    Google App Password (Direct SMTP)
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5 leading-relaxed">
                    Enter your Google email and a 16-character App Password generated in Google Account Security.
                  </span>
                </div>
              </label>

              {emailChoice === 'app_password' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-slate-800">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Google Email *
                    </label>
                    <input
                      type="email"
                      value={appEmail}
                      onChange={(e) => setAppEmail && setAppEmail(e.target.value)}
                      placeholder="user@gmail.com"
                      required
                      className={`w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border text-xs text-white focus:outline-none transition-colors ${
                        !appEmail.trim()
                          ? 'border-rose-500/70 focus:border-rose-500 ring-1 ring-rose-500/20'
                          : 'border-slate-700 focus:border-indigo-500'
                      }`}
                    />
                    {!appEmail.trim() && (
                      <span className="text-[10px] text-rose-400 mt-1 block">Email required</span>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      16-Character App Password *
                    </label>
                    <input
                      type="password"
                      value={appPassword}
                      onChange={(e) => setAppPassword && setAppPassword(e.target.value)}
                      placeholder="xxxx xxxx xxxx xxxx"
                      required
                      className={`w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border text-xs text-white focus:outline-none transition-colors ${
                        !appPassword.trim()
                          ? 'border-rose-500/70 focus:border-rose-500 ring-1 ring-rose-500/20'
                          : 'border-slate-700 focus:border-indigo-500'
                      }`}
                    />
                    {!appPassword.trim() && (
                      <span className="text-[10px] text-rose-400 mt-1 block">Password required</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. SECTION: UNIVERSAL GOOGLE PRODUCTS LOOP */}
      {otherProductKeys.map((key) => {
        const def = getGoogleProductDefinition(key);
        const isVerified = isProductVerified(key);
        const isDrivePicker = def.isGranularPicker || key === 'drive_picker';
        const isEnabled = isDrivePicker ? drivePickerEnabled : (enabledProducts[key] ?? true);

        const handleToggle = () => {
          if (isDrivePicker) {
            if (setDrivePickerEnabled) setDrivePickerEnabled(!drivePickerEnabled);
          } else if (setEnabledProducts) {
            setEnabledProducts((prev) => ({ ...prev, [key]: !isEnabled }));
          }
        };

        return (
          <div key={key} className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                {renderProductIcon(def, 'w-4 h-4')}
                <span>{def.name} Permission</span>
              </h4>
              {isEnabled && isVerified && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verified</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {def.description}
            </p>

            <div
              className={`p-3.5 rounded-xl border transition-all ${
                isEnabled
                  ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500'
                  : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 pr-2">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                    {renderProductIcon(def, 'w-5 h-5')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white block">
                        {def.name} (<code className="text-indigo-300 font-mono text-[10px]">{def.scope.replace('https://www.googleapis.com/auth/', '')}</code>)
                      </span>
                      {isVerified && (
                        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Granted</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      {def.description}
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isEnabled}
                  onClick={handleToggle}
                  className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isEnabled ? 'bg-indigo-600' : 'bg-slate-800 border-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* If Drive Picker: show picker component when active & granted */}
              {isDrivePicker && isEnabled && (
                <div className="mt-3 pt-3 border-t border-slate-800">
                  {isVerified ? (
                    <GoogleDrivePicker
                      userId={userId}
                      viewMimeTypes={drivePickerMimeTypes}
                      supportDrives={true}
                      showUploadView={false}
                      buttonLabel="Select Spreadsheet from Google Drive"
                      selectedFile={pickedGoogleFile || null}
                      onFilePicked={(doc) => {
                        if (doc.mimeType === 'application/vnd.google-apps.folder' || (doc as any).type === 'folder') {
                          appToast.error('Invalid Selection', {
                            description: 'Folders cannot be selected. Please choose a Google Sheet.',
                          });
                          return;
                        }
                        if (setPickedGoogleFile) setPickedGoogleFile(doc);
                        appToast.success('Spreadsheet Selected', {
                          description: `Connected "${doc.name}" to this deployment.`,
                        });
                      }}
                      onClearSelection={() => {
                        if (setPickedGoogleFile) setPickedGoogleFile(null);
                      }}
                    />
                  ) : (
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Verify Google authorization below to open the Drive Picker file selector.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* 3. SECTION: 1-CLICK VERIFICATION BUTTON FOR ALL MISSING PRODUCTS */}
      {needsVerification ? (
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-indigo-950/60 border border-indigo-500/40 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Google Authorization Needed
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {missingOAuthProducts.map((p) => (
                <span
                  key={p.id}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1"
                >
                  {renderProductIcon(p, 'w-3 h-3')}
                  <span>+{p.shortName}</span>
                </span>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            {missingOAuthProducts.length > 1
              ? `Click below to verify ${missingOAuthProducts.map((p) => p.name).join(' and ')} together in one single Google consent screen.`
              : `Authorize ${missingOAuthProducts[0]?.name} access for your Google account.`}
          </p>

          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleStartVerification}
            disabled={isConnecting || !isClientIdConfigured}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.99]"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Waiting for Google Consent Window...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-3.5 h-3.5" />
                <span>
                  {missingOAuthProducts.length > 1
                    ? `Verify Both with Google in One Click (${missingOAuthProducts.length} Permissions)`
                    : `Authorize ${missingOAuthProducts[0]?.name} with Google`}
                </span>
                <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
              </>
            )}
          </button>
        </div>
      ) : isConnected && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-semibold text-emerald-300 block">
                Google Permissions Active &amp; Verified
              </span>
              <span className="text-[11px] text-emerald-400/80 font-mono truncate block">
                {accountEmail || 'Authorized Account'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            {resolvedProductKeys
              .filter((k) => isProductVerified(k))
              .map((k) => {
                const def = getGoogleProductDefinition(k);
                return (
                  <span
                    key={k}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"
                  >
                    {renderProductIcon(def, 'w-3 h-3')}
                    <span>{def.shortName} ✓</span>
                  </span>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
