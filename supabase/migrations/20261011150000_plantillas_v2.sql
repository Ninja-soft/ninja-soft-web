-- Plantillas de email rediseñadas: hero con isotipo, burbujas sin bordes de color, productos y footer.
update public.email_templates set updated_at = now(), html = $tpl$<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light"><title>Recibimos tu consulta</title></head>
<body style="margin:0;padding:0;background:#f3f2f8;-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">Recibimos tu consulta, {{nombre}}. Te respondemos a la brevedad.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f2f8"><tr><td align="center" style="padding:28px 12px 40px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<tr><td style="background:#09051C;background-image:radial-gradient(120% 90% at 50% 0%,#3a1708 0%,#09051C 60%);border-radius:20px 20px 0 0;padding:40px 40px 36px;text-align:center">
  <img src="https://tgaromemhaixgdsdlxiq.supabase.co/storage/v1/object/public/brand/ninja-isotipo-flame.png" alt="" width="44" height="57" style="display:block;margin:0 auto 14px;width:44px;height:57px;border:0" />
  <img src="{{logo_soft}}" alt="Ninja Soft" height="26" style="display:block;margin:0 auto;height:26px;border:0" />
</td></tr>
<tr><td style="background:#ffffff;padding:40px 40px 0;text-align:center">
  <div style="width:72px;height:72px;margin:0 auto 22px;border-radius:50%;background:#fff1ea;line-height:72px;font-size:32px;text-align:center">✉️</div>
  <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#ff5a1f">Consulta recibida</p>
  <h1 style="margin:0 0 12px;font-size:28px;line-height:1.2;font-weight:800;letter-spacing:-0.4px;color:#09051C">¡Gracias, {{nombre}}!</h1>
  <p style="margin:0 auto;max-width:400px;font-size:16px;line-height:1.6;color:#6b7280">Recibimos tu mensaje y un especialista te va a responder a la brevedad, por este mismo email.</p>
</td></tr><tr><td style="background:#ffffff;padding:32px 40px 0">
  <p style="margin:0 0 8px 4px;font-size:12px;color:#9ca3af">Tu mensaje</p>
  <div style="background:#f4f3f8;border-radius:20px 20px 20px 6px;padding:18px 20px;font-size:16px;line-height:1.6;color:#1f2937">{{mensaje}}</div>
</td></tr><tr><td style="background:#ffffff;padding:32px 40px 44px;text-align:center;border-radius:0 0 20px 20px">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td style="border-radius:999px;background:#ff5a1f;background-image:linear-gradient(135deg,#ff4b22,#ff8a1f)">
    <a href="{{link_sitio}}" style="display:inline-block;padding:16px 36px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px">Visitar Ninja Soft</a>
  </td></tr></table><p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:#9ca3af">¿Querés sumar algo? Respondé este email y le llega directo al equipo.</p>
</td></tr><tr><td style="padding:16px 0 0">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#09051C;border-radius:20px"><tr><td style="padding:28px 32px 20px">
    <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#ff8a1f">Mientras tanto</p>
    <p style="margin:0 0 14px;font-size:20px;font-weight:800;color:#ffffff">Conocé lo que hacemos</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding:12px 0;border-top:1px solid rgba(255,255,255,.08)">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td width="44" valign="top"><div style="width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,.08);line-height:36px;text-align:center;font-size:18px">🛒</div></td>
        <td valign="top" style="padding-left:12px"><p style="margin:0;font-size:15px;font-weight:700;color:#ffffff">NinjaPOS</p><p style="margin:2px 0 0;font-size:13px;line-height:1.5;color:#b8aedc">Vendé, cobrá con todos los medios y facturá desde una sola pantalla.</p></td>
      </tr></table></td></tr>
      <tr><td style="padding:12px 0;border-top:1px solid rgba(255,255,255,.08)">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td width="44" valign="top"><div style="width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,.08);line-height:36px;text-align:center;font-size:18px">🧪</div></td>
        <td valign="top" style="padding-left:12px"><p style="margin:0;font-size:15px;font-weight:700;color:#ffffff">Ninja Food</p><p style="margin:2px 0 0;font-size:13px;line-height:1.5;color:#b8aedc">Trazabilidad y gestión bromatológica para la industria alimenticia.</p></td>
      </tr></table></td></tr>
      <tr><td style="padding:12px 0;border-top:1px solid rgba(255,255,255,.08)">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td width="44" valign="top"><div style="width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,.08);line-height:36px;text-align:center;font-size:18px">⚙️</div></td>
        <td valign="top" style="padding-left:12px"><p style="margin:0;font-size:15px;font-weight:700;color:#ffffff">Desarrollo a medida</p><p style="margin:2px 0 0;font-size:13px;line-height:1.5;color:#b8aedc">Integraciones con Mercado Libre, ecommerce, ERP y lo que tu negocio necesite.</p></td>
      </tr></table></td></tr>
    </table>
  </td></tr></table>
</td></tr><tr><td style="padding:28px 24px 0;text-align:center">
  <p style="margin:0 0 10px;font-size:13px;color:#6b7280"><a href="{{link_sitio}}" style="color:#ff5a1f;text-decoration:none;font-weight:600">soft.ninja</a> &nbsp;·&nbsp; <a href="https://www.instagram.com/ninjasoft.latam/" style="color:#ff5a1f;text-decoration:none;font-weight:600">Instagram</a></p>
  <p style="margin:0 0 6px;font-size:12px;line-height:1.6;color:#9ca3af">Ninja Soft · Urquiza 3164, Rosario, Santa Fe, Argentina</p>
  <p style="margin:0;font-size:11px;line-height:1.6;color:#b0b3ba">Recibiste este email porque nos escribiste desde nuestro sitio.</p>
</td></tr>
</table></td></tr></table></body></html>$tpl$ where key = 'contact_ack';

update public.email_templates set updated_at = now(), html = $tpl$<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light"><title>Te respondimos</title></head>
<body style="margin:0;padding:0;background:#f3f2f8;-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">{{respuesta}}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f2f8"><tr><td align="center" style="padding:28px 12px 40px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<tr><td style="background:#09051C;background-image:radial-gradient(120% 90% at 50% 0%,#3a1708 0%,#09051C 60%);border-radius:20px 20px 0 0;padding:40px 40px 36px;text-align:center">
  <img src="https://tgaromemhaixgdsdlxiq.supabase.co/storage/v1/object/public/brand/ninja-isotipo-flame.png" alt="" width="44" height="57" style="display:block;margin:0 auto 14px;width:44px;height:57px;border:0" />
  <img src="{{logo_soft}}" alt="Ninja Soft" height="26" style="display:block;margin:0 auto;height:26px;border:0" />
</td></tr>
<tr><td style="background:#ffffff;padding:40px 40px 0;text-align:center">
  <div style="width:72px;height:72px;margin:0 auto 22px;border-radius:50%;background:#fff1ea;line-height:72px;font-size:32px;text-align:center">💬</div>
  <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#ff5a1f">Nueva respuesta</p>
  <h1 style="margin:0 0 12px;font-size:28px;line-height:1.2;font-weight:800;letter-spacing:-0.4px;color:#09051C">{{nombre}}, te respondimos</h1>
  <p style="margin:0 auto;max-width:400px;font-size:16px;line-height:1.6;color:#6b7280">El equipo de Ninja Soft te escribió en el chat mientras no estabas.</p>
</td></tr><tr><td style="background:#ffffff;padding:32px 40px 0">
  <p style="margin:0 0 8px 4px;font-size:12px;color:#9ca3af">Equipo Ninja Soft · {{fecha}}</p>
  <div style="background:#f4f3f8;border-radius:20px 20px 20px 6px;padding:18px 20px;font-size:16px;line-height:1.6;color:#1f2937">{{respuesta}}</div>
</td></tr><tr><td style="background:#ffffff;padding:32px 40px 44px;text-align:center;border-radius:0 0 20px 20px">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td style="border-radius:999px;background:#ff5a1f;background-image:linear-gradient(135deg,#ff4b22,#ff8a1f)">
    <a href="{{link_sitio}}" style="display:inline-block;padding:16px 36px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px">Seguir en el chat →</a>
  </td></tr></table><p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:#9ca3af">También podés responder este email directamente.</p>
</td></tr><tr><td style="padding:28px 24px 0;text-align:center">
  <p style="margin:0 0 10px;font-size:13px;color:#6b7280"><a href="{{link_sitio}}" style="color:#ff5a1f;text-decoration:none;font-weight:600">soft.ninja</a> &nbsp;·&nbsp; <a href="https://www.instagram.com/ninjasoft.latam/" style="color:#ff5a1f;text-decoration:none;font-weight:600">Instagram</a></p>
  <p style="margin:0 0 6px;font-size:12px;line-height:1.6;color:#9ca3af">Ninja Soft · Urquiza 3164, Rosario, Santa Fe, Argentina</p>
  <p style="margin:0;font-size:11px;line-height:1.6;color:#b0b3ba">Recibiste este email porque nos escribiste desde nuestro sitio.</p>
</td></tr>
</table></td></tr></table></body></html>$tpl$ where key = 'chat_reply';

update public.email_templates set updated_at = now(), html = $tpl$<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light"><title>Nuevo contacto</title></head>
<body style="margin:0;padding:0;background:#f3f2f8;-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">{{nombre}} te dejó una consulta desde la web.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f2f8"><tr><td align="center" style="padding:28px 12px 40px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<tr><td style="background:#09051C;border-radius:20px 20px 0 0;padding:24px 32px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td><img src="{{logo_soft}}" alt="Ninja Soft" height="22" style="display:block;height:22px;border:0" /></td>
    <td align="right" style="font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#ff8a1f">Nuevo contacto</td>
  </tr></table>
</td></tr>
<tr><td style="background:#ffffff;padding:32px 32px 8px">
  <h1 style="margin:0 0 4px;font-size:26px;font-weight:800;letter-spacing:-0.3px;color:#09051C">{{nombre}}</h1>
  <p style="margin:0 0 22px;font-size:14px;color:#6b7280">{{fecha}}</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f6fb;border-radius:16px">
    <tr><td style="padding:16px 20px 6px;font-size:12px;color:#9ca3af">Email</td></tr>
    <tr><td style="padding:0 20px 12px;font-size:16px;font-weight:600"><a href="mailto:{{email}}" style="color:#09051C;text-decoration:none">{{email}}</a></td></tr>
    <tr><td style="padding:6px 20px;font-size:12px;color:#9ca3af">Teléfono</td></tr>
    <tr><td style="padding:0 20px 12px;font-size:16px;font-weight:600;color:#09051C">{{telefono}}</td></tr>
    <tr><td style="padding:6px 20px;font-size:12px;color:#9ca3af">Rubro</td></tr>
    <tr><td style="padding:0 20px 12px;font-size:16px;font-weight:600;color:#09051C">{{rubro}}</td></tr>
    <tr><td style="padding:6px 20px;font-size:12px;color:#9ca3af">Reunión por Teams</td></tr>
    <tr><td style="padding:0 20px 16px;font-size:16px;font-weight:700;color:#5b5fc7">{{reunion}}</td></tr>
  </table>
</td></tr><tr><td style="background:#ffffff;padding:32px 40px 0">
  <p style="margin:0 0 8px 4px;font-size:12px;color:#9ca3af">Mensaje</p>
  <div style="background:#f4f3f8;border-radius:20px 20px 20px 6px;padding:18px 20px;font-size:16px;line-height:1.6;color:#1f2937">{{mensaje}}</div>
</td></tr><tr><td style="background:#ffffff;padding:32px 40px 44px;text-align:center;border-radius:0 0 20px 20px">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td style="border-radius:999px;background:#ff5a1f;background-image:linear-gradient(135deg,#ff4b22,#ff8a1f)">
    <a href="mailto:{{email}}" style="display:inline-block;padding:16px 36px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px">Responder a {{nombre}}</a>
  </td></tr></table><p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:#9ca3af">O respondé este email: le llega directo.</p>
</td></tr><tr><td style="padding:28px 24px 0;text-align:center">
  <p style="margin:0 0 10px;font-size:13px;color:#6b7280"><a href="{{link_sitio}}" style="color:#ff5a1f;text-decoration:none;font-weight:600">soft.ninja</a> &nbsp;·&nbsp; <a href="https://www.instagram.com/ninjasoft.latam/" style="color:#ff5a1f;text-decoration:none;font-weight:600">Instagram</a></p>
  <p style="margin:0 0 6px;font-size:12px;line-height:1.6;color:#9ca3af">Ninja Soft · Urquiza 3164, Rosario, Santa Fe, Argentina</p>
  <p style="margin:0;font-size:11px;line-height:1.6;color:#b0b3ba">Recibiste este email porque nos escribiste desde nuestro sitio.</p>
</td></tr>
</table></td></tr></table></body></html>$tpl$ where key = 'contact_notify';

