'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { apiClient } from '@/lib/api-client';
import { CustomTool, UserToolDeployment, GooglePickerDoc } from '@/lib/types';
import { GoogleAuthIntegrationSection, GmailAuthMode } from './GoogleAuthIntegrationSection';
import { appToast } from '@/lib/toast';
import { COMPANY_NAME } from '@/config/site';
import {
  X,
  Share2,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Terminal,
  ShieldCheck,
  PlusCircle,
  KeyRound,
  GitBranch,
} from 'lucide-react';

interface ToolDeployModalProps {
  tool: CustomTool | null;
  isOpen: boolean;
  onClose: () => void;
  onDeploySuccess?: (deployment: UserToolDeployment) => void;
}

function normalizeGoogleProduct(raw: string): string | null {
  const s = raw.toLowerCase().trim();
  if (!s) return null;
  if (s.includes('sheet')) return 'sheets';
  if (s.includes('doc')) return 'docs';
  if (s.includes('drive')) return 'drive';
  if (s.includes('gmail') || s.includes('mail') || s.includes('email')) return 'gmail';
  if (s.includes('meet')) return 'meet';
  if (s.includes('calendar')) return 'calendar';
  if (s.includes('form')) return 'forms';
  return s;
}

export function ToolDeployModal({ tool, isOpen, onClose, onDeploySuccess }: ToolDeployModalProps) {
  const { user } = useUser();
  const currentUserId = user?.id || 'guest_user';

  // Config data fields generated from tool schema
  const [configValues, setConfigValues] = useState<Record<string, any>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  // Unified Google Auth & Permissions State (defaulting to company_email)
  const [emailChannel, setEmailChannel] = useState<GmailAuthMode>('company_email');
  const [appEmail, setAppEmail] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [drivePickerEnabled, setDrivePickerEnabled] = useState(false);
  const [pickedGoogleFile, setPickedGoogleFile] = useState<GooglePickerDoc | null>(null);
  const [isAuthValid, setIsAuthValid] = useState(true);

  const [requiresHitl, setRequiresHitl] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployment, setDeployment] = useState<UserToolDeployment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Initialize form values from tool schema when modal opens
  useEffect(() => {
    if (tool && tool.form_schema?.properties) {
      const initial: Record<string, any> = {};
      Object.entries(tool.form_schema.properties).forEach(([key, prop]) => {
        initial[key] = prop.default !== undefined ? prop.default : (prop.type === 'boolean' ? false : '');
      });
      setConfigValues(initial);
      setTouchedFields({});
      setDeployment(null);
      setError(null);
      setEmailChannel('company_email');
      setAppEmail('');
      setAppPassword('');
      setRequiresHitl(false);
      setPickedGoogleFile(null);
    }
  }, [tool, isOpen]);

  // Product Detection
  const toolDetected: string[] = (tool?.google_products && tool.google_products.length > 0)
    ? tool.google_products
    : (tool?.google_products_detected && tool.google_products_detected.length > 0)
      ? tool.google_products_detected
      : [];

  const titleDescScan = `${tool?.title || ''} ${tool?.description || ''} ${tool?.specification_summary || ''}`.toLowerCase();
  const toolFinalProductsSet = new Set<string>();
  toolDetected.forEach((p: string) => {
    const norm = normalizeGoogleProduct(p);
    if (norm) toolFinalProductsSet.add(norm);
  });

  if (titleDescScan.includes('sheet')) toolFinalProductsSet.add('sheets');
  if (titleDescScan.includes('drive')) toolFinalProductsSet.add('drive');
  if (titleDescScan.includes('doc')) toolFinalProductsSet.add('docs');
  if (titleDescScan.includes('meet')) toolFinalProductsSet.add('meet');
  if (titleDescScan.includes('calendar')) toolFinalProductsSet.add('calendar');
  if (titleDescScan.includes('forms') || titleDescScan.includes('form')) toolFinalProductsSet.add('forms');
  if (titleDescScan.includes('gmail') || titleDescScan.includes('email') || titleDescScan.includes('mail')) {
    toolFinalProductsSet.add('gmail');
  }

  const finalProducts = Array.from(toolFinalProductsSet);
  const fileProducts = finalProducts.filter((p) => ['sheets', 'drive', 'docs'].includes(p));
  const hasFileProducts = fileProducts.length > 0;
  const hasGmail = finalProducts.includes('gmail') || titleDescScan.includes('email') || titleDescScan.includes('mail');

  // Auto-enable drive picker if tool detects spreadsheets or drive
  useEffect(() => {
    if (isOpen && hasFileProducts) {
      setDrivePickerEnabled(true);
    }
  }, [isOpen, hasFileProducts]);

  // Required Field Validation
  const properties = tool?.form_schema?.properties || {};
  const requiredKeys = tool?.form_schema?.required || [];

  const missingRequiredKeys = useMemo(() => {
    return requiredKeys.filter((key) => {
      const val = configValues[key];
      return val === undefined || val === null || String(val).trim() === '';
    });
  }, [requiredKeys, configValues]);

  const areAllRequiredFieldsFilled = missingRequiredKeys.length === 0;

  if (!isOpen || !tool) return null;

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areAllRequiredFieldsFilled) {
      // Mark all required fields as touched
      const touched: Record<string, boolean> = {};
      requiredKeys.forEach((k) => {
        touched[k] = true;
      });
      setTouchedFields(touched);
      appToast.warning('Missing Required Fields', {
        description: 'Please fill in all highlighted required configuration fields.',
      });
      return;
    }

    if (!isAuthValid) {
      appToast.warning('Verification Needed', {
        description: 'Please complete the Google authentication / permission verification.',
      });
      return;
    }

    setIsDeploying(true);
    setError(null);

    try {
      const effectiveEmail = emailChannel === 'app_password'
        ? appEmail.trim()
        : (user?.primaryEmailAddress?.emailAddress || '');

      const mappedEmailService = emailChannel === 'oauth'
        ? 'gmail'
        : emailChannel === 'app_password'
        ? 'google_app_password'
        : emailChannel === 'company_email'
        ? 'company_email'
        : (hasGmail ? 'platform_default' : 'none');

      const configData: Record<string, any> = {
        ...configValues,
        email_service: mappedEmailService,
        email_channel_choice: emailChannel,
        file_access_choice: drivePickerEnabled ? 'granular_picker' : 'none',
        file_products: fileProducts,
        user_email: effectiveEmail,
        personal_email: effectiveEmail,
        gmail_app_email: appEmail.trim(),
        gmail_app_password: appPassword.trim(),
        google_file_id: pickedGoogleFile?.id,
        google_file_name: pickedGoogleFile?.name,
        google_file_mime: pickedGoogleFile?.mimeType,
        google_file_url: pickedGoogleFile?.url,
      };

      const res = await apiClient.deployTool({
        tool_id: tool.id,
        user_id: currentUserId,
        config_data: configData,
        requires_hitl: requiresHitl,
        email_service: mappedEmailService,
        google_email: effectiveEmail,
        google_app_password: appPassword.trim(),
      });

      setDeployment(res);
      appToast.success('Tool Instance Deployed!', {
        description: `Dedicated automation webhook generated for "${tool.title}".`,
      });

      if (onDeploySuccess) {
        onDeploySuccess(res);
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to deploy tool instance.';
      setError(msg);
      appToast.error('Deployment Failed', { description: msg });
    } finally {
      setIsDeploying(false);
    }
  };

  const host = typeof window !== 'undefined' ? window.location.origin : '';
  const webhookSecret = deployment?.user_webhook_secret;
  const activeWebhookUrl = webhookSecret
    ? `${host}/api/proxy/webhooks/${webhookSecret}/`
    : tool?.webhook_secret
    ? `${host}/api/proxy/webhooks/${tool.webhook_secret}/`
    : '';
  const webhookUrl = activeWebhookUrl;

  const handleCopy = () => {
    if (!webhookUrl) return;
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    appToast.info('Webhook Copied', { description: 'Inbound webhook URL copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetForAnotherDeploy = () => {
    setDeployment(null);
    setError(null);
  };

  const handleClose = () => {
    setDeployment(null);
    setError(null);
    onClose();
  };

  const isSubmitDisabled = isDeploying || !areAllRequiredFieldsFilled || !isAuthValid;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-2xl my-8 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Deploy Tool: {tool.title}
              </h2>
              <p className="text-xs text-slate-400">
                Configure operational parameters and email identity to generate a dedicated webhook instance.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {!deployment ? (
            <form onSubmit={handleDeploy} className="space-y-6">
              {/* Tool summary card */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block mb-1">
                  Target AI Tool
                </span>
                <p className="font-semibold text-slate-100">{tool.title}</p>
                <p className="text-slate-400 text-[11px] mt-0.5 line-clamp-2">
                  {tool.description}
                </p>
              </div>

              {/* Inbound Webhook Endpoint Preview */}
              {activeWebhookUrl && (
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Inbound Webhook Endpoint</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      Webhook Trigger Ready
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <code className="text-xs font-mono text-cyan-300 flex-1 truncate select-all">
                      {activeWebhookUrl}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs transition-colors shrink-0 flex items-center gap-1 border border-slate-700/60"
                      title="Copy Webhook URL"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[10px] text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    External tools or webhooks can invoke this automation by sending HTTP POST requests to this URL.
                  </p>
                </div>
              )}

              {/* Dynamic Input Properties from Schema with Required Field Highlighting */}
              {Object.keys(properties).length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Deployment Configuration Parameters
                    </h4>
                    {requiredKeys.length > 0 && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {requiredKeys.length - missingRequiredKeys.length}/{requiredKeys.length} required filled
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3.5 p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                    {Object.entries(properties).map(([key, prop]) => {
                      const isRequired = requiredKeys.includes(key);
                      const val = configValues[key];
                      const isFilled = val !== undefined && val !== null && String(val).trim() !== '';
                      const isMissing = isRequired && !isFilled;

                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                              <span>{prop.title || key}</span>
                              {isRequired && <span className="text-rose-400 font-bold">*</span>}
                            </label>
                            {isRequired && (
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition-colors ${
                                  isFilled
                                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                                    : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                }`}
                              >
                                {isFilled ? 'Filled ✓' : 'Required'}
                              </span>
                            )}
                          </div>

                          {prop.type === 'boolean' ? (
                            <label className="flex items-center gap-2 cursor-pointer mt-1">
                              <input
                                type="checkbox"
                                checked={!!configValues[key]}
                                onChange={(e) =>
                                  setConfigValues((prev) => ({
                                    ...prev,
                                    [key]: e.target.checked,
                                  }))
                                }
                                className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
                              />
                              <span className="text-xs text-slate-300">Enable</span>
                            </label>
                          ) : (
                            <input
                              type={prop.type === 'number' ? 'number' : 'text'}
                              value={configValues[key] !== undefined ? configValues[key] : ''}
                              onChange={(e) =>
                                setConfigValues((prev) => ({
                                  ...prev,
                                  [key]: prop.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value,
                                }))
                              }
                              onBlur={() => setTouchedFields((prev) => ({ ...prev, [key]: true }))}
                              placeholder={`Enter ${prop.title || key}...`}
                              required={isRequired}
                              className={`w-full px-3 py-2 rounded-xl text-xs transition-colors focus:outline-none ${
                                isMissing
                                  ? 'bg-rose-950/20 border border-rose-500/80 text-white placeholder:text-rose-300/40 ring-1 ring-rose-500/30 focus:border-rose-500'
                                  : 'bg-slate-900 border border-slate-700/80 text-slate-200 focus:border-indigo-500'
                              }`}
                            />
                          )}

                          {isMissing && (
                            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-rose-400 font-medium">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>This field is required. Submit will remain disabled until filled.</span>
                            </div>
                          )}

                          {prop.description && !isMissing && (
                            <p className="text-[11px] text-slate-400 mt-1">{prop.description}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Unified Google Auth & Permissions Manager Component */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
                <GoogleAuthIntegrationSection
                  userId={currentUserId}
                  products={finalProducts}
                  emailChoice={emailChannel}
                  setEmailChoice={setEmailChannel}
                  appEmail={appEmail}
                  setAppEmail={setAppEmail}
                  appPassword={appPassword}
                  setAppPassword={setAppPassword}
                  drivePickerEnabled={drivePickerEnabled}
                  setDrivePickerEnabled={setDrivePickerEnabled}
                  pickedGoogleFile={pickedGoogleFile}
                  setPickedGoogleFile={setPickedGoogleFile}
                  showGmailSection={hasGmail}
                  showDriveSection={hasFileProducts}
                  onAuthValidityChange={(valid) => setIsAuthValid(valid)}
                />
              </div>

              {/* Human-in-the-Loop (HITL) Deployment Gatekeeper */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span>Human-in-the-Loop (HITL) Gatekeeper</span>
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                          requiresHitl
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                            : 'bg-slate-800 text-slate-400 border-slate-700 font-medium'
                        }`}
                      >
                        {requiresHitl ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      When enabled for this deployment, incoming webhooks and automated workflow runs will pause before executing external actions, sending you an approval notification.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={requiresHitl}
                    onClick={() => setRequiresHitl((prev) => !prev)}
                    className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      requiresHitl ? 'bg-amber-500' : 'bg-slate-800 border-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        requiresHitl ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button with Disabled State and Visual Indicators */}
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.99]"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Provisioning Instance...</span>
                  </>
                ) : !areAllRequiredFieldsFilled ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-300" />
                    <span>Fill Required Configuration Fields to Deploy ({missingRequiredKeys.length} Remaining)</span>
                  </>
                ) : !isAuthValid ? (
                  <>
                    <KeyRound className="w-4 h-4 text-amber-300" />
                    <span>Complete Google Authorization to Deploy</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Deploy Tool Instance</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Confirmation after deployment */
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Tool instance deployed successfully! The Execute button on this tool is now active.</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Personal Webhook Endpoint
                </label>
                <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <code className="text-xs font-mono text-indigo-300 flex-1 truncate select-all">
                    {webhookUrl}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs transition-colors shrink-0"
                    title="Copy Webhook URL"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* cURL Example */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mb-2">
                  <Terminal className="w-3 h-3 text-slate-400" />
                  <span>Inbound Webhook Trigger Example:</span>
                </div>
                <pre className="text-slate-300 text-[11px] overflow-x-auto whitespace-pre-wrap select-all">
{`curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{"event": "trigger", "message": "Execute workflow"}'`}
                </pre>
              </div>

              {/* Config summary */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                  Active Deployment Configuration
                </span>
                <div className="flex justify-between">
                  <span className="text-slate-400">Email Dispatch:</span>
                  <span className="text-slate-200 capitalize">{emailChannel.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Human-In-The-Loop:</span>
                  <span className={`font-semibold ${deployment.requires_hitl ? 'text-amber-300' : 'text-slate-300'}`}>
                    {deployment.requires_hitl ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                {Object.entries(deployment.config_data || {}).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-[11px]">
                    <span className="text-slate-400">{k}:</span>
                    <span className="text-slate-200 truncate max-w-xs">{String(v)}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetForAnotherDeploy}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Deploy Another Instance</span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                >
                  Close &amp; View Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
