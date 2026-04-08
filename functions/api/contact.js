export async function onRequestPost(context) {
  try {
    const formData = await context.request.formData();

    const formType = String(formData.get("formType") || "").trim();
    const nombre = String(formData.get("nombre") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const telefono = String(formData.get("telefono") || "").trim();
    const mensaje = String(formData.get("mensaje") || "").trim();

    const motivo = String(formData.get("motivo") || "").trim();
    const asunto = String(formData.get("asunto") || "").trim();

    const botField = String(formData.get("bot-field") || "").trim();

    if (botField) {
      return json({ ok: true, message: "OK" }, 200);
    }

    if (!formType || !nombre || !email || !mensaje) {
      return json({ ok: false, error: "Faltan campos obligatorios." }, 400);
    }

    if (!["contacto", "catering"].includes(formType)) {
      return json({ ok: false, error: "Tipo de formulario inválido." }, 400);
    }

    if (!isValidEmail(email)) {
      return json({ ok: false, error: "Email inválido." }, 400);
    }

    let subject = "";
    let html = "";

    if (formType === "contacto") {
      subject = `Nuevo mensaje de contacto - ${motivo || "Sin motivo"}`;
      html = `
        <h2>Nuevo mensaje de contacto</h2>
        <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Teléfono:</strong> ${escapeHtml(telefono)}</p>
        <p><strong>Motivo:</strong> ${escapeHtml(motivo)}</p>
        <p><strong>Mensaje:</strong><br>${escapeHtml(mensaje).replace(/\n/g, "<br>")}</p>
      `;
    }

    if (formType === "catering") {
      subject = `Nueva solicitud de catering - ${asunto || "Sin asunto"}`;
      html = `
        <h2>Nueva solicitud de catering</h2>
        <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Teléfono:</strong> ${escapeHtml(telefono)}</p>
        <p><strong>Asunto:</strong> ${escapeHtml(asunto)}</p>
        <p><strong>Mensaje:</strong><br>${escapeHtml(mensaje).replace(/\n/g, "<br>")}</p>
      `;
    }

    if (!context.env.RESEND_API_KEY) {
      return json(
        { ok: false, error: "Falta configurar RESEND_API_KEY en Cloudflare." },
        500,
      );
    }

    if (!context.env.CONTACT_TO_EMAIL) {
      return json(
        {
          ok: false,
          error: "Falta configurar CONTACT_TO_EMAIL en Cloudflare.",
        },
        500,
      );
    }

    if (!context.env.CONTACT_FROM_EMAIL) {
      return json(
        {
          ok: false,
          error: "Falta configurar CONTACT_FROM_EMAIL en Cloudflare.",
        },
        500,
      );
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${context.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: context.env.CONTACT_FROM_EMAIL,
        to: [context.env.CONTACT_TO_EMAIL],
        reply_to: email,
        subject,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      return json(
        {
          ok: false,
          error: "No se pudo enviar el correo.",
          detail: errorText,
        },
        500,
      );
    }

    return json({ ok: true, message: "Mensaje enviado correctamente." }, 200);
  } catch (error) {
    return json({ ok: false, error: "Error interno del servidor." }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
