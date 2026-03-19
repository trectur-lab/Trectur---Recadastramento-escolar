import express from "express";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import cors from "cors";
import { supabase } from "./supabase";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Encryption Utilities for SMTP Password ---
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "trectur-secret-key-32-chars-long"; // Should be 32 chars
const IV_LENGTH = 16;

function encrypt(text: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string) {
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    return text; // Fallback if not encrypted
  }
}

async function seedDatabase() {
  console.log("[Server] Starting background seeding...");
  
  // Migration: Update student role to client
  try {
    const { error: migrationError } = await supabase.from("users").update({ role: 'client' }).eq("role", 'student');
    if (migrationError && migrationError.code !== 'PGRST116') {
      console.error("[Server] Error in student role migration:", migrationError);
    }
  } catch (e) {
    console.error("[Server] Exception in student role migration:", e);
  }

  // Seed Admin User
  const adminEmail = "admin@trectur.com.br";
  const adminPassword = "P4t1nh0367%";
  const hashedPassword = bcrypt.hashSync(adminPassword, 10);

  try {
    const { data: existingAdmin, error: adminFetchError } = await supabase
      .from("users")
      .select("*")
      .eq("email", adminEmail)
      .single();

    if (adminFetchError && adminFetchError.code !== 'PGRST116') {
      console.error("[Server] Error fetching admin:", adminFetchError);
    }

    if (!existingAdmin) {
      console.log("[Server] Seeding admin user...");
      const { error: insertError } = await supabase.from("users").insert([
        { name: "Administrador Geral", email: adminEmail, password: hashedPassword, role: "admin", email_confirmado: 1 }
      ]);
      if (insertError) console.error("[Server] Error seeding admin:", insertError);
    } else {
      const { error: updateError } = await supabase.from("users").update({ password: hashedPassword, email_confirmado: 1 }).eq("email", adminEmail);
      if (updateError) console.error("[Server] Error updating admin:", updateError);
    }
  } catch (e) {
    console.error("[Server] Exception in admin seeding:", e);
  }

  // Seed Default Settings
  const defaultSettings = [
    { key: "defaultExpiration", value: "30/04/2025" },
    { key: "validityDays", value: "365" },
    { key: "maxUploadSize", value: "10" },
    { key: "allowedExtensions", value: JSON.stringify(["PDF", "JPG", "PNG"]) },
    { key: "autoRenewal", value: "false" },
    { key: "lgpdDocument", value: "" },
    { key: "primaryBgColor", value: "#f8fafc" },
    { key: "secondaryBgColor", value: "#ffffff" },
    { key: "primaryColor", value: "#be123c" },
    { key: "secondaryColor", value: "#334155" },
    { key: "buttonColor", value: "#be123c" },
    { key: "buttonFontColor", value: "#ffffff" },
    { key: "buttonHoverColor", value: "" },
    { key: "buttonHoverFontColor", value: "" },
    { key: "secondaryButtonColor", value: "transparent" },
    { key: "secondaryButtonFontColor", value: "#be123c" },
    { key: "secondaryButtonHoverColor", value: "transparent" },
    { key: "secondaryButtonHoverFontColor", value: "#be123c" },
    { key: "companyName", value: "Trectur" },
    { key: "companyNameFontColor", value: "#0f172a" },
    { key: "logoBgColor", value: "#be123c" },
    { key: "logo", value: "" },
    { key: "generalFontColor", value: "#334155" },
    { key: "smtpHost", value: "smtp.gmail.com" },
    { key: "smtpPort", value: "465" },
    { key: "smtpUser", value: "naoresponder.trectur@gmail.com" },
    { key: "smtpPass", value: encrypt("xybe rlcr geic lfcy") },
    { key: "smtpFromName", value: "Trectur" },
    { key: "smtpFromEmail", value: "naoresponder.trectur@gmail.com" },
    { key: "appUrl", value: "" }
  ];

  for (const s of defaultSettings) {
    try {
      const isSmtpKey = s.key.startsWith('smtp');
      const { data: exists, error: settingsError } = await supabase.from("settings").select("*").eq("key", s.key).single();
      
      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error(`[Server] Error checking setting ${s.key}:`, settingsError);
      }

      if (!exists || isSmtpKey) {
        const { error: upsertError } = await supabase.from("settings").upsert(s);
        if (upsertError) console.error(`[Server] Error upserting setting ${s.key}:`, upsertError);
      }
    } catch (e) {
      console.error(`[Server] Exception seeding setting ${s.key}:`, e);
    }
  }
  console.log("[Server] Seeding completed.");
}

export const app = express();
const PORT = 3000;

export async function startServer() {
  console.log("[Server] Starting initialization...");
  console.log(`[Server] NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`[Server] Starting in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`[Server] Environment APP_URL: ${process.env.APP_URL}`);
  
  // Trust proxy is important for apps behind Nginx/Cloud Run
  app.set('trust proxy', 1);

  // Request Logger at the very top
  app.use((req, res, next) => {
    console.log(`[Server] ${req.method} ${req.url}`);
    next();
  });

  app.get("/ping", (req, res) => res.send("pong"));
 
  // Run seeding in background to not block startup
  seedDatabase();
 
  const apiRouter = express.Router();

  // Explicit CORS for API
  apiRouter.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  apiRouter.use(express.json({ limit: '50mb' }));
  apiRouter.use(express.urlencoded({ limit: '50mb', extended: true }));

  apiRouter.get("/debug/url", (req, res) => {
    res.json({
      envAppUrl: process.env.APP_URL,
      nodeEnv: process.env.NODE_ENV,
      port: PORT
    });
  });

  apiRouter.get("/debug/headers", (req, res) => res.json(req.headers));

  apiRouter.get("/diag", async (req, res) => {
    try {
      const { data, error, count } = await supabase.from("users").select("*", { count: 'exact', head: true });
      
      let adminUserResult = await supabase.from("users").select("email, role, email_confirmado").eq("email", "admin@trectur.com.br").single();
      let adminUser = adminUserResult.data;

      // Se não existe, tenta criar manualmente via rota de diag para ver o erro real
      let seedResult = null;
      if (!adminUser && req.query.seed === 'true') {
        const adminPassword = "P4t1nh0367%";
        const hashedPassword = bcrypt.hashSync(adminPassword, 10);
        seedResult = await supabase.from("users").insert([
          { name: "Administrador Geral", email: "admin@trectur.com.br", password: hashedPassword, role: "admin", email_confirmado: 1 }
        ]).select().single();
      }

      if (error) {
        return res.json({ 
          status: "error", 
          message: "Falha ao conectar com o Supabase ou tabela 'users' não encontrada.",
          error: error,
          env_check: {
            has_url: !!process.env.SUPABASE_URL,
            has_key: !!process.env.SUPABASE_ANON_KEY,
            key_prefix: process.env.SUPABASE_ANON_KEY?.substring(0, 5)
          }
        });
      }
      res.json({ 
        status: "ok", 
        userCount: count, 
        adminExists: !!adminUser,
        adminDetails: adminUser ? { role: adminUser.role, confirmed: adminUser.email_confirmado } : null,
        seedAttempt: seedResult
      });
    } catch (err: any) {
      res.json({ status: "exception", message: err.message });
    }
  });

  // API Routes
  apiRouter.post("/authenticate", async (req, res) => {
    console.log(`[Server] Auth attempt for: ${req.body?.email}`);
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        console.warn("[Server] Login failed: Missing email or password");
        return res.status(400).json({ success: false, message: "E-mail e senha são obrigatórios." });
      }

      console.log(`[Server] Searching for user: ${email}`);
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();
      
      if (userError && userError.code !== 'PGRST116') {
        console.error("[Server] Supabase error in /authenticate:", userError);
        return res.status(500).json({ 
          success: false, 
          message: "Erro de banco de dados ao autenticar.",
          details: process.env.NODE_ENV !== 'production' ? userError.message : undefined
        });
      }
      
      if (user) {
        console.log(`[Server] User found: ${user.email}. Comparing passwords...`);
        const passwordMatch = await bcrypt.compare(password, user.password);
        
        if (passwordMatch) {
          if (user.email_confirmado === 0) {
            console.warn(`[Server] Login failed: Email not confirmed for ${email}`);
            return res.status(403).json({ 
              success: false, 
              message: "Sua conta ainda não foi validada. Verifique seu e-mail para ativar o acesso." 
            });
          }
          console.log(`[Server] Login success for: ${email}`);
          return res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
        } else {
          console.warn(`[Server] Login failed: Password mismatch for ${email}`);
        }
      } else {
        console.warn(`[Server] Login failed: User not found: ${email}`);
      }
      
      res.status(401).json({ success: false, message: "Credenciais inválidas" });
    } catch (error: any) {
      console.error("[Server] Error in /api/login:", error);
      res.status(500).json({ 
        success: false, 
        message: "Erro interno no servidor",
        details: process.env.NODE_ENV !== 'production' ? error.message : undefined
      });
    }
  });

  async function enviarEmailConfirmacao(emailDestino, token, name) {
    console.log(`[SMTP] Iniciando processo de envio para ${emailDestino}...`);
    
    // Fetch SMTP settings from Supabase
    const { data: settingsData } = await supabase.from("settings").select("*");
    const settings: any = {};
    settingsData?.forEach(s => settings[s.key] = s.value);

    const smtpHost = settings.smtpHost;
    const smtpPort = settings.smtpPort;
    const smtpUser = settings.smtpUser;
    const smtpPassEnc = settings.smtpPass;
    const smtpFromName = settings.smtpFromName;
    const smtpFromEmail = settings.smtpFromEmail;

    const smtpPass = smtpPassEnc ? decrypt(smtpPassEnc) : process.env.SMTP_PASS;

    // Remove trailing slash if present to avoid double slashes in URL
    let appUrl = settings.appUrl || process.env.APP_URL || `http://localhost:${3000}`;
    
    // If settings.appUrl is empty but we have process.env.APP_URL, save it to settings for future use
    if (!settings.appUrl && process.env.APP_URL) {
      console.log(`[SMTP] Populando settings.appUrl com process.env.APP_URL: ${process.env.APP_URL}`);
      supabase.from("settings").upsert({ key: 'appUrl', value: process.env.APP_URL }).then(({ error }) => {
        if (error) console.error("[SMTP] Erro ao salvar appUrl em settings:", error);
      });
    }

    if (appUrl.endsWith('/')) {
      appUrl = appUrl.slice(0, -1);
    }
    const linkConfirmacao = `${appUrl}/validar?token=${token}`;
    console.log(`[SMTP] Link de confirmação gerado: ${linkConfirmacao}`);
    console.log(`[SMTP] APP_URL usado: ${appUrl} (Fonte: ${settings.appUrl ? 'Config' : (process.env.APP_URL ? 'Env' : 'Default')})`);

    const port = parseInt(smtpPort || process.env.SMTP_PORT || "465");
    const secure = (smtpPort ? port === 465 : (process.env.SMTP_SECURE === "true" || port === 465));
    const host = smtpHost || process.env.SMTP_HOST || "smtp.gmail.com";
    const isGmail = host.includes("gmail.com");

    // Determine auth credentials
    let authUser = smtpUser || process.env.SMTP_USER;
    let authPass = smtpPass || process.env.SMTP_PASS;

    // Fallback to hardcoded Gmail credentials ONLY if no custom credentials are provided AND host is Gmail
    if (!authUser && isGmail) {
      authUser = "naoresponder.trectur@gmail.com";
      authPass = "xybe rlcr geic lfcy";
    }

    const transporterConfig: any = {
      host: host,
      port: port,
      secure: secure,
      auth: {
        user: authUser,
        pass: authPass
      },
      tls: {
        rejectUnauthorized: false
      },
      requireTLS: !secure,
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 15000,
      logger: true,
      debug: true
    };

    // Use 'service: gmail' ONLY if it's explicitly a gmail host
    if (transporterConfig.host && transporterConfig.host.includes("gmail.com")) {
      console.log("[SMTP] Detectado provedor Gmail, aplicando configurações otimizadas.");
      delete transporterConfig.host;
      delete transporterConfig.port;
      delete transporterConfig.secure;
      transporterConfig.service = "gmail";
    } else {
      console.log(`[SMTP] Usando servidor customizado: ${transporterConfig.host}:${transporterConfig.port}`);
    }

    const transporter = nodemailer.createTransport(transporterConfig);

    try {
      // Verify connection configuration
      await transporter.verify();
      console.log("[SMTP] Conexão com servidor de e-mail verificada com sucesso.");

      const fromName = smtpFromName || process.env.SMTP_FROM_NAME || "Suporte Trectur";
      const fromEmail = smtpFromEmail || smtpUser || process.env.SMTP_USER || "naoresponder.trectur@gmail.com";

      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0f172a; margin-bottom: 10px;">Bem-vindo à Trectur!</h1>
            <p style="color: #64748b; font-size: 16px;">Olá <strong>${name}</strong>, estamos quase lá!</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <p style="color: #334155; margin-bottom: 25px; font-size: 16px; line-height: 1.5;">
              Para ativar sua conta e começar a utilizar nossos serviços, por favor confirme seu endereço de e-mail clicando no botão abaixo:
            </p>
            
            <a href="${linkConfirmacao}" style="display: inline-block; background: #be123c; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(190, 18, 60, 0.2);">
              Confirmar Meu E-mail
            </a>
          </div>
          
          <p style="color: #94a3b8; font-size: 14px; text-align: center; line-height: 1.5;">
            Se o botão acima não funcionar, copie e cole o link abaixo no seu navegador:<br>
            <span style="color: #be123c; word-break: break-all;">${linkConfirmacao}</span>
          </p>
          
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            Este é um e-mail automático, por favor não responda.<br>
            &copy; ${new Date().getFullYear()} Trectur - Todos os direitos reservados.
          </p>
        </div>
      `;

      console.log(`[SMTP] Preparando envio de e-mail de confirmação: From="${fromName}" <${fromEmail}>, To=${emailDestino}`);

      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: emailDestino,
        subject: "Confirme seu cadastro na Trectur",
        html: htmlContent
      });
      console.log(`[SMTP] E-mail de confirmação enviado com sucesso para ${emailDestino}`);
      return true;
    } catch (error) {
      console.error(`[SMTP] Erro crítico ao enviar e-mail para ${emailDestino}:`, error);
      if (error.response) console.error(`[SMTP Response] ${error.response}`);
      if (error.code) console.error(`[SMTP Code] ${error.code}`);
      console.log(`[DEBUG] Link de Confirmação que falhou: ${linkConfirmacao}`);
      throw error; 
    }
  }

  async function enviarEmailRecuperacao(emailDestino, token, name) {
    console.log(`[SMTP] Iniciando processo de recuperação para ${emailDestino}...`);
    
    const { data: settingsData } = await supabase.from("settings").select("*");
    const settings: any = {};
    settingsData?.forEach(s => settings[s.key] = s.value);

    const smtpHost = settings.smtpHost;
    const smtpPort = settings.smtpPort;
    const smtpUser = settings.smtpUser;
    const smtpPassEnc = settings.smtpPass;
    const smtpFromName = settings.smtpFromName;
    const smtpFromEmail = settings.smtpFromEmail;

    const smtpPass = smtpPassEnc ? decrypt(smtpPassEnc) : process.env.SMTP_PASS;

    let appUrl = process.env.APP_URL || `http://localhost:${3000}`;
    if (appUrl.endsWith('/')) {
      appUrl = appUrl.slice(0, -1);
    }
    const linkRecuperacao = `${appUrl}/redefinir-senha?token=${token}`;

    const port = parseInt(smtpPort || process.env.SMTP_PORT || "465");
    const secure = (smtpPort ? port === 465 : (process.env.SMTP_SECURE === "true" || port === 465));
    const host = smtpHost || process.env.SMTP_HOST || "smtp.gmail.com";
    const isGmail = host.includes("gmail.com");

    // Determine auth credentials
    let authUser = smtpUser || process.env.SMTP_USER;
    let authPass = smtpPass || process.env.SMTP_PASS;

    // Fallback to hardcoded Gmail credentials ONLY if no custom credentials are provided AND host is Gmail
    if (!authUser && isGmail) {
      authUser = "naoresponder.trectur@gmail.com";
      authPass = "xybe rlcr geic lfcy";
    }

    const transporterConfig: any = {
      host: host,
      port: port,
      secure: secure,
      auth: {
        user: authUser,
        pass: authPass
      },
      tls: {
        rejectUnauthorized: false
      },
      requireTLS: !secure,
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 15000,
      logger: true,
      debug: true
    };

    if (transporterConfig.host && transporterConfig.host.includes("gmail.com")) {
      delete transporterConfig.host;
      delete transporterConfig.port;
      delete transporterConfig.secure;
      transporterConfig.service = "gmail";
    }

    const transporter = nodemailer.createTransport(transporterConfig);

    try {
      await transporter.verify();
      
      const fromName = smtpFromName || process.env.SMTP_FROM_NAME || "Suporte Trectur";
      const fromEmail = smtpFromEmail || smtpUser || process.env.SMTP_USER || "naoresponder.trectur@gmail.com";

      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0f172a; margin-bottom: 10px;">Recuperação de Senha</h1>
            <p style="color: #64748b; font-size: 16px;">Olá <strong>${name}</strong>, você solicitou a redefinição de sua senha.</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <p style="color: #334155; margin-bottom: 25px; font-size: 16px; line-height: 1.5;">
              Clique no botão abaixo para escolher uma nova senha:
            </p>
            
            <a href="${linkRecuperacao}" style="display: inline-block; background: #0f172a; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.2);">
              Redefinir Minha Senha
            </a>
          </div>
          
          <p style="color: #94a3b8; font-size: 14px; text-align: center; line-height: 1.5;">
            Se você não solicitou esta alteração, por favor ignore este e-mail.<br>
            O link expirará em 24 horas.
          </p>
          
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            &copy; ${new Date().getFullYear()} Trectur - Todos os direitos reservados.
          </p>
        </div>
      `;

      console.log(`[SMTP] Preparando envio de e-mail de recuperação: From="${fromName}" <${fromEmail}>, To=${emailDestino}`);

      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: emailDestino,
        subject: "Recuperação de Senha - Trectur",
        html: htmlContent
      });
      console.log(`[SMTP] E-mail de recuperação enviado com sucesso para ${emailDestino}`);
      return true;
    } catch (error) {
      console.error(`[SMTP] Erro crítico ao enviar e-mail de recuperação para ${emailDestino}:`, error);
      if (error.response) console.error(`[SMTP Response] ${error.response}`);
      if (error.code) console.error(`[SMTP Code] ${error.code}`);
      throw error;
    }
  }

  apiRouter.post("/register", async (req, res) => {
    const { name, email, password, role = "client" } = req.body;
    
    // --- SEGURANÇA: Apenas o admin pode criar operadores, e ninguém pode criar admins via API ---
    if (role === 'admin') {
      return res.status(403).json({ success: false, message: "Não é permitido criar administradores via formulário." });
    }

    // --- PASSO 1: Bloqueio de Duplicidade ---
    const { data: usuarioExistente, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error("[Register] Supabase check error:", checkError);
      return res.status(500).json({ 
        success: false, 
        message: "Erro ao verificar e-mail no banco de dados.",
        details: checkError.code === '42P01' ? "A tabela 'users' não existe. Por favor, execute o script SQL de configuração." : checkError.message
      });
    }
    
    if (usuarioExistente) {
      return res.status(400).json({ 
        success: false,
        message: "Este e-mail já está cadastrado. Por favor, utilize a Recuperação de Senha se esqueceu seu acesso." 
      });
    }

    // --- PASSO 2: Gerar Token e Criar Conta ---
    const token = crypto.randomBytes(32).toString('hex');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Operadores cadastrados pelo sistema já nascem confirmados
    // Clientes precisam confirmar e-mail
    const confirmado = role === 'operator' ? 1 : 0;
    
    try {
      const { data: result, error: insertError } = await supabase
        .from("users")
        .insert([
          { name, email, password: hashedPassword, role, token_validacao: token, email_confirmado: confirmado }
        ])
        .select()
        .single();
      
      if (insertError) {
        console.error("[Register] Supabase insert error:", insertError);
        return res.status(500).json({ 
          success: false, 
          message: "Erro ao salvar novo usuário no banco de dados.",
          details: insertError.message
        });
      }
      
      // --- PASSO 3: Enviar E-mail de Validação (apenas para clientes) ---
      console.log(`[Register] Usuário criado: ${email}. Confirmado: ${confirmado}`);
      if (confirmado === 0) {
        try {
          console.log(`[Register] Enviando e-mail de confirmação para ${email}...`);
          await enviarEmailConfirmacao(email, token, name);
          console.log(`[Register] E-mail de confirmação enviado com sucesso para ${email}`);
        } catch (mailError) {
          console.error("[Register] Falha no envio do e-mail, mas conta foi criada (pendente):", mailError);
          return res.status(201).json({ 
            success: true, 
            userId: result.id, 
            message: "Cadastro realizado, mas houve um problema ao enviar o e-mail de confirmação. Por favor, entre em contato com o suporte ou tente novamente mais tarde." 
          });
        }
      }
      
      res.status(201).json({ 
        success: true, 
        userId: result.id, 
        message: confirmado === 1 
          ? "Operador cadastrado com sucesso! Ele já pode acessar o sistema." 
          : "Cadastro realizado! Enviamos um link de confirmação para o seu e-mail. Por favor, verifique sua caixa de entrada (e spam)." 
      });
    } catch (err) {
      console.error("Erro no registro:", err);
      res.status(500).json({ success: false, message: "Erro interno ao cadastrar." });
    }
  });

  app.get("/validar", async (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).send("Token inválido.");
    
    const { data: usuario, error: fetchError } = await supabase
      .from("users")
      .select("id")
      .eq("token_validacao", token)
      .single();

    if (fetchError || !usuario) {
      // Determine appUrl for the error page link
      const { data: settingsData } = await supabase.from("settings").select("*");
      const settings: any = {};
      settingsData?.forEach(s => settings[s.key] = s.value);
      let appUrl = settings.appUrl || process.env.APP_URL || "";
      if (appUrl.endsWith('/')) appUrl = appUrl.slice(0, -1);
      const homeUrl = appUrl ? `${appUrl}/` : "/";

      return res.status(400).send(`
        <html>
          <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f8fafc;">
            <div style="background: white; padding: 40px; border-radius: 24px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); text-align: center;">
              <h1 style="color: #be123c; margin-bottom: 16px;">Link Inválido</h1>
              <p style="color: #64748b; margin-bottom: 24px;">Este link de confirmação é inválido ou já expirou.</p>
              <a href="${homeUrl}" style="display: inline-block; background: #be123c; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold;">Voltar ao Início</a>
            </div>
          </body>
        </html>
      `);
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({ email_confirmado: 1, token_validacao: null })
      .eq("id", usuario.id);

    if (updateError) {
      console.error("[Server] Supabase error in /validar:", updateError);
      return res.status(500).send("Erro ao validar e-mail.");
    }
    
    // Determine appUrl for the success page link
    const { data: settingsData } = await supabase.from("settings").select("*");
    const settings: any = {};
    settingsData?.forEach(s => settings[s.key] = s.value);
    let appUrl = settings.appUrl || process.env.APP_URL || "";
    if (appUrl.endsWith('/')) appUrl = appUrl.slice(0, -1);
    const loginUrl = appUrl ? `${appUrl}/` : "/";

    res.send(`
      <html>
        <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f8fafc;">
          <div style="background: white; padding: 40px; border-radius: 24px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); text-align: center;">
            <h1 style="color: #0f172a; margin-bottom: 16px;">E-mail Confirmado!</h1>
            <p style="color: #64748b; margin-bottom: 24px;">Sua conta foi ativada com sucesso. Agora você já pode fazer login.</p>
            <a href="${loginUrl}" style="display: inline-block; background: #be123c; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold;">Fazer Login</a>
          </div>
        </body>
      </html>
    `);
  });

  apiRouter.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
    console.log(`[Server] Solicitação de recuperação de senha para: ${email}`);
    if (!email) return res.status(400).json({ success: false, message: "E-mail é obrigatório." });

    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("email", email)
      .single();

    if (fetchError || !user) {
      console.log(`[Server] Usuário não encontrado para recuperação: ${email}`);
      return res.json({ success: true, message: "Se este e-mail estiver cadastrado, enviaremos um link de recuperação." });
    }

    const token = crypto.randomBytes(32).toString('hex');
    console.log(`[Server] Gerando token de recuperação para ${email}`);
    
    const { error: updateError } = await supabase
      .from("users")
      .update({ recovery_token: token })
      .eq("id", user.id);

    if (updateError) {
      console.error("[Server] Supabase error in /forgot-password:", updateError);
      return res.status(500).json({ success: false, message: "Erro ao processar solicitação." });
    }

    try {
      console.log(`[Server] Tentando enviar e-mail de recuperação para ${email}`);
      await enviarEmailRecuperacao(user.email, token, user.name);
      console.log(`[Server] E-mail de recuperação enviado com sucesso para ${email}`);
      res.json({ success: true, message: "Link de recuperação enviado com sucesso!" });
    } catch (err) {
      console.error(`[Server] Erro ao enviar e-mail de recuperação para ${email}:`, err);
      res.status(500).json({ success: false, message: "Erro ao enviar e-mail. Tente novamente mais tarde." });
    }
  });

  apiRouter.post("/reset-password", async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ success: false, message: "Dados incompletos." });

    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("id")
      .eq("recovery_token", token)
      .single();

    if (fetchError || !user) {
      return res.status(400).json({ success: false, message: "Token inválido ou expirado." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const { error: updateError } = await supabase
      .from("users")
      .update({ password: hashedPassword, recovery_token: null })
      .eq("id", user.id);

    if (updateError) {
      console.error("[Server] Supabase error in /reset-password:", updateError);
      return res.status(500).json({ success: false, message: "Erro ao redefinir senha." });
    }

    res.json({ success: true, message: "Senha alterada com sucesso!" });
  });

  apiRouter.post("/resend-confirmation", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "E-mail é obrigatório." });

    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("id, name, email, token_validacao, email_confirmado")
      .eq("email", email)
      .single();

    if (fetchError || !user) return res.status(404).json({ success: false, message: "Usuário não encontrado." });
    if (user.email_confirmado === 1) return res.status(400).json({ success: false, message: "Este e-mail já foi confirmado." });

    let token = user.token_validacao;
    if (!token) {
      token = crypto.randomBytes(32).toString('hex');
      const { error: updateError } = await supabase
        .from("users")
        .update({ token_validacao: token })
        .eq("id", user.id);
      
      if (updateError) {
        console.error("[Server] Supabase error in /resend-confirmation:", updateError);
        return res.status(500).json({ success: false, message: "Erro ao atualizar token." });
      }
    }

    try {
      await enviarEmailConfirmacao(user.email, token, user.name);
      res.json({ success: true, message: "E-mail de confirmação reenviado com sucesso!" });
    } catch (err) {
      console.error("Erro ao reenviar e-mail de confirmação:", err);
      res.status(500).json({ success: false, message: "Erro ao enviar e-mail. Tente novamente mais tarde." });
    }
  });

  apiRouter.get("/users/operators", async (req, res) => {
    const { data: operators, error } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("role", "operator");
    
    if (error) {
      console.error("[Server] Supabase error in GET /users/operators:", error);
      return res.status(500).json({ success: false, message: "Erro ao buscar operadores." });
    }
    res.json(operators);
  });

  apiRouter.delete("/users/:id", async (req, res) => {
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", req.params.id);
    
    if (error) {
      console.error("[Server] Supabase error in DELETE /users/:id:", error);
      return res.status(500).json({ success: false, message: "Erro ao excluir usuário." });
    }
    res.json({ success: true });
  });

  apiRouter.get("/settings", async (req, res) => {
    const { data: rows, error } = await supabase.from("settings").select("*");
    if (error) {
      console.error("[Server] Supabase error in GET /settings:", error);
      return res.status(500).json({ success: false, message: "Erro ao buscar configurações." });
    }
    const settings = {};
    rows?.forEach((r: any) => {
      if (r.key === "allowedExtensions") {
        try {
          settings[r.key] = JSON.parse(r.value);
        } catch (e) {
          settings[r.key] = [];
        }
      } else if (r.key === "autoRenewal") {
        settings[r.key] = r.value === "true";
      } else if (r.key === "maxUploadSize") {
        settings[r.key] = parseInt(r.value);
      } else {
        settings[r.key] = r.value;
      }
    });
    res.json(settings);
  });

  apiRouter.post("/settings", async (req, res) => {
    const settings = req.body;
    for (const [key, value] of Object.entries(settings)) {
      const val = typeof value === "object" ? JSON.stringify(value) : String(value);
      await supabase.from("settings").upsert({ key, value: val });
    }
    res.json({ success: true });
  });

  // --- SMTP Admin Routes ---
  apiRouter.get("/admin/smtp", async (req, res) => {
    const keys = ['smtpHost', 'smtpPort', 'smtpUser', 'smtpFromName', 'smtpFromEmail'];
    const { data: rows, error } = await supabase.from("settings").select("*").in("key", keys);
    
    if (error) {
      console.error("[Server] Supabase error in GET /admin/smtp:", error);
      return res.status(500).json({ success: false, message: "Erro ao buscar configurações SMTP." });
    }

    const settings: any = {};
    keys.forEach(key => {
      settings[key] = rows?.find(r => r.key === key)?.value || "";
    });

    // Check if password exists but don't return it
    const { data: passRow } = await supabase.from("settings").select("value").eq("key", "smtpPass").single();
    settings['hasPassword'] = !!passRow?.value;
    res.json(settings);
  });

  apiRouter.post("/admin/smtp", async (req, res) => {
    const { smtpHost, smtpPort, smtpUser, smtpPass, smtpFromName, smtpFromEmail } = req.body;
    
    const updates = [];
    if (smtpHost) updates.push({ key: 'smtpHost', value: smtpHost });
    if (smtpPort) updates.push({ key: 'smtpPort', value: String(smtpPort) });
    if (smtpUser) updates.push({ key: 'smtpUser', value: smtpUser });
    if (smtpFromName) updates.push({ key: 'smtpFromName', value: smtpFromName });
    if (smtpFromEmail) updates.push({ key: 'smtpFromEmail', value: smtpFromEmail });
    if (smtpPass) {
      const encryptedPass = encrypt(smtpPass);
      updates.push({ key: 'smtpPass', value: encryptedPass });
    }

    for (const update of updates) {
      await supabase.from("settings").upsert(update);
    }
    
    res.json({ success: true });
  });

  apiRouter.post("/admin/smtp/test", async (req, res) => {
    const { smtpHost, smtpPort, smtpUser, smtpPass, smtpFromName, smtpFromEmail } = req.body;
    
    let finalPass = smtpPass;
    if (!finalPass) {
      const { data: passRow } = await supabase.from("settings").select("value").eq("key", "smtpPass").single();
      finalPass = passRow?.value ? decrypt(passRow.value) : process.env.SMTP_PASS;
    }

    const port = parseInt(smtpPort || process.env.SMTP_PORT || "465");
    const secure = (smtpPort ? port === 465 : (process.env.SMTP_SECURE === "true" || port === 465));
    const host = smtpHost || process.env.SMTP_HOST || "smtp.gmail.com";
    const isGmail = host.includes("gmail.com");

    // Determine auth credentials
    let authUser = smtpUser || process.env.SMTP_USER;
    let authPass = finalPass || process.env.SMTP_PASS;

    // Fallback to hardcoded Gmail credentials ONLY if no custom credentials are provided AND host is Gmail
    if (!authUser && isGmail) {
      authUser = "naoresponder.trectur@gmail.com";
      authPass = "xybe rlcr geic lfcy";
    }

    const transporterConfig: any = {
      host: host,
      port: port,
      secure: secure,
      auth: {
        user: authUser,
        pass: authPass
      },
      tls: {
        rejectUnauthorized: false
      },
      requireTLS: !secure,
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 15000,
      logger: true,
      debug: true
    };

    if (transporterConfig.host && transporterConfig.host.includes("gmail.com")) {
      delete transporterConfig.host;
      delete transporterConfig.port;
      delete transporterConfig.secure;
      transporterConfig.service = "gmail";
    }

    const transporter = nodemailer.createTransport(transporterConfig);

    try {
      await transporter.verify();
      
      // Also try sending a test email
      const fromName = smtpFromName || process.env.SMTP_FROM_NAME || "Teste Trectur";
      const fromEmail = smtpFromEmail || smtpUser || process.env.SMTP_USER || "naoresponder.trectur@gmail.com";
      
      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: smtpUser || fromEmail,
        subject: "Teste de Configuração SMTP - Trectur",
        text: "Se você recebeu este e-mail, sua configuração SMTP está funcionando corretamente!",
        html: "<b>Se você recebeu este e-mail, sua configuração SMTP está funcionando corretamente!</b>"
      });

      res.json({ success: true, message: "Conexão verificada e e-mail de teste enviado com sucesso!" });
    } catch (error) {
      console.error("[SMTP Test] Erro:", error);
      res.status(500).json({ success: false, message: `Falha na conexão: ${error.message}` });
    }
  });

  apiRouter.get("/requests", async (req, res) => {
    const { data: requests, error } = await supabase
      .from("requests")
      .select("*")
      .order("id", { ascending: false });
    
    if (error) {
      console.error("[Server] Supabase error in GET /requests:", error);
      return res.status(500).json({ success: false, message: "Erro ao buscar solicitações." });
    }
    res.json(requests);
  });

  apiRouter.get("/requests/user/:userId", async (req, res) => {
    const { data: requests, error } = await supabase
      .from("requests")
      .select("*")
      .eq("user_id", req.params.userId)
      .order("id", { ascending: false });
    
    if (error) {
      console.error("[Server] Supabase error in GET /requests/user:", error);
      return res.status(500).json({ success: false, message: "Erro ao buscar solicitações." });
    }
    res.json(requests);
  });

  apiRouter.post("/requests", async (req, res) => {
    try {
      const { user_id, name, serial } = req.body;
      if (!user_id || !name || !serial) {
        return res.status(400).json({ success: false, message: "Dados incompletos." });
      }
      // Force America/Sao_Paulo timezone
      const dataEnvio = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
      
      const { data: result, error } = await supabase
        .from("requests")
        .insert([
          { user_id, name, serial, doc: '', date: dataEnvio, status: 'pending_upload', data_envio: dataEnvio }
        ])
        .select()
        .single();

      if (error) {
        console.error("[Server] Supabase error in POST /requests:", error);
        return res.status(500).json({ 
          success: false, 
          message: "Erro ao salvar solicitação no banco de dados.",
          details: error.message
        });
      }
      res.json({ success: true, requestId: result.id });
    } catch (err: any) {
      console.error("Erro ao criar solicitação:", err);
      res.status(500).json({ 
        success: false, 
        message: "Erro interno ao salvar solicitação.",
        details: err.message
      });
    }
  });

  apiRouter.post("/requests/:id/upload", async (req, res) => {
    const { doc } = req.body;
    const dateNow = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
    
    const { error } = await supabase
      .from("requests")
      .update({ status: 'analyzing', doc, date: dateNow })
      .eq("id", req.params.id);

    if (error) {
      console.error("[Server] Supabase error in POST /requests/:id/upload:", error);
      return res.status(500).json({ success: false, message: "Erro ao fazer upload." });
    }
    res.json({ success: true });
  });

  apiRouter.post("/requests/:id/approve", async (req, res) => {
    const { operatorId } = req.body;
    const { data: request, error: fetchError } = await supabase
      .from("requests")
      .select("*")
      .eq("id", req.params.id)
      .single();
    
    if (fetchError || !request) {
      return res.status(404).json({ success: false, message: "Solicitação não encontrada" });
    }

    // Get settings
    const { data: settingsRows } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ['validityDays', 'defaultExpiration']);
    
    const settingsMap: any = {};
    settingsRows?.forEach(s => settingsMap[s.key] = s.value);

    const validityDays = parseInt(settingsMap['validityDays'] || "365");
    const defaultExpiration = settingsMap['defaultExpiration']?.trim();

    let expiryDate = "";

    if (defaultExpiration && /^\d{2}\/\d{2}\/\d{4}$/.test(defaultExpiration)) {
      expiryDate = defaultExpiration;
    } else {
      const now = new Date();
      const saoPauloNow = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
      saoPauloNow.setDate(saoPauloNow.getDate() + validityDays);
      expiryDate = saoPauloNow.toLocaleDateString("pt-BR");
    }
    
    // Update request status and validity
    const { error: updateError } = await supabase
      .from("requests")
      .update({ status: 'approved', data_validade: expiryDate })
      .eq("id", req.params.id);
    
    if (updateError) {
      console.error("[Server] Supabase error in POST /requests/:id/approve:", updateError);
      return res.status(500).json({ success: false, message: "Erro ao aprovar solicitação." });
    }
    
    // Insert into cards
    const { error: cardError } = await supabase
      .from("cards")
      .insert([
        { 
          user_id: request.user_id, 
          name: request.name, 
          serial: request.serial, 
          status: 'approved', 
          date: expiryDate, 
          data_envio: request.data_envio || request.date 
        }
      ]);

    if (cardError) {
      console.error("[Server] Supabase error in POST /requests/:id/approve (insert card):", cardError);
    }

    // Log de Auditoria
    if (operatorId) {
      const timestamp = new Date().toISOString();
      await supabase.from("operator_logs").insert([
        { 
          operator_id: operatorId, 
          action: `Aprovou solicitação #${req.params.id} (Cartão: ${request.serial})`, 
          target_id: req.params.id, 
          timestamp 
        }
      ]);
    }

    res.json({ success: true });
  });

  apiRouter.post("/requests/:id/reject", async (req, res) => {
    const { reason, operatorId } = req.body;
    
    const { error: updateError } = await supabase
      .from("requests")
      .update({ status: 'rejected', reject_reason: reason })
      .eq("id", req.params.id);

    if (updateError) {
      console.error("[Server] Supabase error in POST /requests/:id/reject:", updateError);
      return res.status(500).json({ success: false, message: "Erro ao rejeitar solicitação." });
    }
    
    // Log de Auditoria
    if (operatorId) {
      const timestamp = new Date().toISOString();
      await supabase.from("operator_logs").insert([
        { 
          operator_id: operatorId, 
          action: `Recusou solicitação #${req.params.id}. Motivo: ${reason}`, 
          target_id: req.params.id, 
          timestamp 
        }
      ]);
    }
    
    res.json({ success: true });
  });

  apiRouter.post("/cards/:id/update-expiry", async (req, res) => {
    const { expiryDate, operatorId } = req.body;
    const { data: card, error: fetchError } = await supabase
      .from("cards")
      .select("*")
      .eq("id", req.params.id)
      .single();
    
    if (fetchError || !card) return res.status(404).json({ success: false, message: "Cartão não encontrado" });

    // REGRA DE NEGÓCIO (BACK-END): Só permite se status for 'approved' (Cadastrado)
    if (card.status !== 'approved') {
      return res.status(403).json({ success: false, message: "Edição não permitida para este status." });
    }

    const { error: updateError } = await supabase
      .from("cards")
      .update({ date: expiryDate })
      .eq("id", req.params.id);

    if (updateError) {
      console.error("[Server] Supabase error in POST /cards/:id/update-expiry:", updateError);
      return res.status(500).json({ success: false, message: "Erro ao atualizar validade." });
    }

    // Log de Auditoria
    if (operatorId) {
      const timestamp = new Date().toISOString();
      await supabase.from("operator_logs").insert([
        { operator_id: operatorId, action: `Alterou validade do cartão ${card.serial} para ${expiryDate}`, target_id: req.params.id, timestamp }
      ]);
    }

    res.json({ success: true });
  });

  apiRouter.get("/logs", async (req, res) => {
    const { data: logs, error } = await supabase
      .from("operator_logs")
      .select(`
        *,
        users:operator_id (name)
      `)
      .order("timestamp", { ascending: false })
      .limit(100);
    
    if (error) {
      console.error("[Server] Supabase error in GET /logs:", error);
      return res.status(500).json({ success: false, message: "Erro ao buscar logs." });
    }

    // Format logs to match expected structure (flattening operator_name)
    const formattedLogs = logs.map((log: any) => ({
      ...log,
      operator_name: log.users?.name
    }));

    res.json(formattedLogs);
  });

  apiRouter.get("/cards/user/:userId", async (req, res) => {
    const { data: cards, error } = await supabase
      .from("cards")
      .select("*")
      .eq("user_id", req.params.userId);
    
    if (error) {
      console.error("[Server] Supabase error in GET /cards/user:", error);
      return res.status(500).json({ success: false, message: "Erro ao buscar cartões." });
    }
    res.json(cards);
  });

  // Mount API Router
  app.use("/api", apiRouter);

  // Catch-all for API routes to prevent fallthrough to Vite/SPA
  apiRouter.all("*", (req, res) => {
    console.warn(`[Server] 404 API Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ success: false, message: `Rota de API não encontrada: ${req.method} ${req.url}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[Server] Listening on http://0.0.0.0:${PORT}`);
    });
  }
}

if (!process.env.VERCEL) {
  startServer().catch(err => {
    console.error("CRITICAL: Failed to start server:", err);
    process.exit(1);
  });
}
