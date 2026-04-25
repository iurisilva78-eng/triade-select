export const DEFAULT_SITE_CONFIG = [

  // ─── Identidade Visual ────────────────────────────────────────────────────
  { key: "design_accent_color",  label: "Cor de destaque (hex)",       type: "color",  section: "identidade", value: "#A8823A" },
  { key: "design_display_font",  label: "Fonte de títulos",            type: "font",   section: "identidade", value: "DM Serif Display" },
  { key: "design_body_font",     label: "Fonte do corpo de texto",     type: "font_body", section: "identidade", value: "Inter Tight" },
  { key: "design_border_radius", label: "Raio dos cantos (px)",        type: "range",  section: "identidade", value: "4" },
  { key: "design_theme",         label: "Tema padrão",                 type: "theme",  section: "identidade", value: "light" },

  // ─── Barra de anúncios ───────────────────────────────────────────────────
  { key: "announcement_1", label: "Mensagem 1",  type: "text", section: "announcement", value: "Frete grátis acima de R$ 500" },
  { key: "announcement_2", label: "Mensagem 2",  type: "text", section: "announcement", value: "Personalização gratuita com seu logo" },
  { key: "announcement_3", label: "Mensagem 3",  type: "text", section: "announcement", value: "Parcelamos em até 3× sem juros via WhatsApp" },

  // ─── Hero ────────────────────────────────────────────────────────────────
  { key: "hero_eyebrow",        label: "Eyebrow (texto acima do título)",  type: "text",     section: "hero", value: "— Coleção permanente" },
  { key: "hero_title",          label: "Título (parte normal)",            type: "text",     section: "hero", value: "Uniformes que falam pela" },
  { key: "hero_title_italic",   label: "Título (parte itálica / dourada)", type: "text",     section: "hero", value: "sua barbearia" },
  { key: "hero_subtitle",       label: "Subtítulo / descrição",            type: "textarea", section: "hero", value: "Uniforme que vende antes do serviço começar. Capas, aventais e camisetas feitos sob encomenda com o logo da sua marca." },
  { key: "hero_cta_primary",    label: "Botão principal",                  type: "text",     section: "hero", value: "Explorar coleção" },
  { key: "hero_cta_secondary",  label: "Botão secundário",                 type: "text",     section: "hero", value: "Criar conta grátis" },
  { key: "hero_image",          label: "Imagem do produto (hero)",         type: "image",    section: "hero", value: "" },

  // ─── Seção de Diferenciais ───────────────────────────────────────────────
  { key: "feature_1_title", label: "Diferencial 1 — Título",      type: "text",     section: "features", value: "Feito sob encomenda" },
  { key: "feature_1_desc",  label: "Diferencial 1 — Descrição",   type: "textarea", section: "features", value: "Cada peça produzida com atenção ao detalhe e qualidade para a sua barbearia." },
  { key: "feature_2_title", label: "Diferencial 2 — Título",      type: "text",     section: "features", value: "Prazo de 15 dias úteis" },
  { key: "feature_2_desc",  label: "Diferencial 2 — Descrição",   type: "textarea", section: "features", value: "Produção e entrega com prazo garantido após confirmação de pagamento." },
  { key: "feature_3_title", label: "Diferencial 3 — Título",      type: "text",     section: "features", value: "Entrega em todo o Brasil" },
  { key: "feature_3_desc",  label: "Diferencial 3 — Descrição",   type: "textarea", section: "features", value: "Envio pelos Correios (PAC e SEDEX) para qualquer cidade." },
  { key: "feature_4_title", label: "Diferencial 4 — Título",      type: "text",     section: "features", value: "Personalização gratuita" },
  { key: "feature_4_desc",  label: "Diferencial 4 — Descrição",   type: "textarea", section: "features", value: "Bordado ou serigrafia com o logo da sua marca, sem custo adicional nesta coleção." },

  // ─── Banner B2B ──────────────────────────────────────────────────────────
  { key: "b2b_eyebrow",  label: "Eyebrow do banner B2B",  type: "text",     section: "b2b", value: "— Para barbearias" },
  { key: "b2b_title",    label: "Título do banner B2B",   type: "text",     section: "b2b", value: "Programa B2B para barbearias cadastradas" },
  { key: "b2b_subtitle", label: "Subtítulo do banner B2B",type: "textarea", section: "b2b", value: "Descontos progressivos, priority production e condições exclusivas para barbearias com pedidos recorrentes." },
  { key: "b2b_cta",      label: "Botão do banner B2B",    type: "text",     section: "b2b", value: "Quero ser B2B" },

  // ─── Rodapé ──────────────────────────────────────────────────────────────
  { key: "footer_tagline",   label: "Tagline do rodapé",              type: "text", section: "footer", value: "Uniforme que vende antes do serviço começar." },
  { key: "footer_copy",      label: "Copyright",                      type: "text", section: "footer", value: "© 2025 Triade Select. Todos os direitos reservados." },
  { key: "footer_link_1_label", label: "Link 1 — Texto",             type: "text", section: "footer", value: "Produtos" },
  { key: "footer_link_1_href",  label: "Link 1 — URL",               type: "text", section: "footer", value: "/produtos" },
  { key: "footer_link_2_label", label: "Link 2 — Texto",             type: "text", section: "footer", value: "Minha conta" },
  { key: "footer_link_2_href",  label: "Link 2 — URL",               type: "text", section: "footer", value: "/conta" },
  { key: "footer_link_3_label", label: "Link 3 — Texto",             type: "text", section: "footer", value: "Programa B2B" },
  { key: "footer_link_3_href",  label: "Link 3 — URL",               type: "text", section: "footer", value: "/conta" },

  // ─── Geral & Contato ────────────────────────────────────────────────────
  { key: "site_name",        label: "Nome do site",                type: "text", section: "geral", value: "Triade Select" },
  { key: "whatsapp_contact", label: "WhatsApp de contato (com DDD)", type: "text", section: "geral", value: "" },
  { key: "instagram_url",    label: "Instagram (URL)",             type: "text", section: "geral", value: "" },
  { key: "meta_title",       label: "Título da aba (SEO)",         type: "text", section: "geral", value: "Triade Select — Uniformes para Barbearias" },
  { key: "meta_description", label: "Descrição (SEO)",             type: "textarea", section: "geral", value: "Capas, uniformes e aventais personalizados para barbearias profissionais. Qualidade premium, entrega em todo o Brasil." },

  // ─── WhatsApp / integração (mantidos do original) ────────────────────────
  { key: "whatsapp_group_id",      label: "ID do grupo WhatsApp",       type: "text", section: "whatsapp", value: "" },
  { key: "whatsapp_provider",      label: "Provedor WhatsApp",          type: "text", section: "whatsapp", value: "evolution" },
  { key: "whatsapp_api_url",       label: "Z-API URL (send-text)",      type: "text", section: "whatsapp", value: "" },
  { key: "whatsapp_client_token",  label: "Z-API Client-Token",         type: "text", section: "whatsapp", value: "" },
  { key: "whatsapp_evo_base_url",  label: "Evolution API — Base URL",   type: "text", section: "whatsapp", value: "" },
  { key: "whatsapp_evo_instance",  label: "Evolution API — Instância",  type: "text", section: "whatsapp", value: "triade-select" },
  { key: "whatsapp_evo_api_key",   label: "Evolution API — API Key",    type: "text", section: "whatsapp", value: "" },
];
