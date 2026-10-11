-- Logos por unidad de negocio + plantillas de email con la estética de marca.
insert into public.app_settings (key, value) values
  ('logo_soft_url', 'https://res.cloudinary.com/dl6yhrcx0/image/upload/f_auto,q_auto/Ninja_Soft_Logo_tft2oy'),
  ('logo_pos_url', 'https://res.cloudinary.com/dl6yhrcx0/image/upload/f_auto,q_auto/Ninja_Pos_Logo_pmxzew'),
  ('logo_food_url', '')
on conflict (key) do nothing;

update public.email_templates set updated_at = now(), html = $tpl$<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>Recibimos tu consulta</title></head>
<body style="margin:0;padding:0;background:#f3f2f8">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">Recibimos tu consulta, {{nombre}}. Te respondemos a la brevedad.</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f2f8"><tr><td align="center" style="padding:32px 12px">
<table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;font-family:Arial,Helvetica,sans-serif;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(9,5,28,.08)">
  <tr><td style="background:#09051C;padding:32px 40px 28px;text-align:center">
    <img src="{{logo_soft}}" alt="Ninja Soft" height="30" style="display:block;margin:0 auto;height:30px;border:0" />
  </td></tr>
  <tr><td style="background:#ffffff;padding:40px 40px 8px;text-align:center">
    <div style="width:64px;height:64px;background:#fff1ea;border-radius:50%;margin:0 auto 20px;line-height:64px;text-align:center;font-size:28px">✉️</div>
    <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#09051C">¡Gracias por escribirnos, {{nombre}}!</h1>
    <p style="margin:0;font-size:15px;line-height:1.6;color:#6b7280">Recibimos tu consulta y un especialista te va a responder a la brevedad.</p>
  </td></tr>
  <tr><td style="background:#ffffff;padding:24px 40px 0"><div style="height:1px;background:#f3f4f6"></div></td></tr>
  <tr><td style="background:#ffffff;padding:24px 40px 8px;font-size:15px;line-height:1.7;color:#374151">
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:.6px;text-transform:uppercase;color:#9ca3af">Tu mensaje</p>
    <div style="margin:0 0 24px;padding:16px 18px;background:#f9fafb;border-left:3px solid #f97316;border-radius:8px;color:#374151">{{mensaje}}</div>
    <p style="margin:0 0 28px;font-size:14px;color:#6b7280">Si querés sumar algo, respondé este email y le llega directo al equipo.</p>
  </td></tr>
  <tr><td style="background:#ffffff;padding:0 40px 40px;text-align:center">
    <a href="{{link_sitio}}" style="display:inline-block;background:#f97316;background-image:linear-gradient(135deg,#ff4b22,#ff8a1f);color:#ffffff;text-decoration:none;font-weight:700;padding:15px 40px;border-radius:10px;font-size:15px;letter-spacing:.3px">Conocé Ninja Soft →</a>
  </td></tr>
  <tr><td style="background:#09051C;padding:28px 40px 24px;text-align:center">
    <img src="{{logo_soft}}" alt="Ninja Soft" height="18" style="display:block;margin:0 auto 16px;height:18px;border:0" />
    <div style="height:1px;background:#1f2937;margin:0 0 16px"></div>
    <p style="color:#6b7280;font-size:11px;line-height:1.6;margin:0">Urquiza 3164 · Rosario, Santa Fe, Argentina<br /><a href="https://www.instagram.com/ninjasoft.latam/" style="color:#9ca3af;text-decoration:none">Instagram @ninjasoft.latam</a></p>
  </td></tr>
</table></td></tr></table></body></html>$tpl$
where key = 'contact_ack';

update public.email_templates set updated_at = now(), subject = 'Nuevo contacto: {{nombre}} · {{rubro}}', html = $tpl$<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nuevo contacto</title></head>
<body style="margin:0;padding:0;background:#f3f2f8">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f2f8"><tr><td align="center" style="padding:32px 12px">
<table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;font-family:Arial,Helvetica,sans-serif;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(9,5,28,.08)">
  <tr><td style="background:#09051C;padding:24px 40px;text-align:center">
    <img src="{{logo_soft}}" alt="Ninja Soft" height="24" style="display:block;margin:0 auto;height:24px;border:0" />
  </td></tr>
  <tr><td style="background:#ffffff;padding:32px 40px 8px">
    <p style="margin:0 0 6px;font-size:12px;letter-spacing:.6px;text-transform:uppercase;color:#f97316;font-weight:700">Nuevo contacto desde la web</p>
    <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#09051C">{{nombre}}</h1>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;color:#374151">
      <tr><td style="padding:8px 0;border-top:1px solid #f3f4f6;color:#9ca3af;width:90px">Email</td><td style="padding:8px 0;border-top:1px solid #f3f4f6"><a href="mailto:{{email}}" style="color:#09051C">{{email}}</a></td></tr>
      <tr><td style="padding:8px 0;border-top:1px solid #f3f4f6;color:#9ca3af">Teléfono</td><td style="padding:8px 0;border-top:1px solid #f3f4f6">{{telefono}}</td></tr>
      <tr><td style="padding:8px 0;border-top:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6;color:#9ca3af">Rubro</td><td style="padding:8px 0;border-top:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6">{{rubro}}</td></tr>
    </table>
  </td></tr>
  <tr><td style="background:#ffffff;padding:20px 40px 32px;font-size:15px;line-height:1.7;color:#374151">
    <div style="padding:16px 18px;background:#f9fafb;border-left:3px solid #f97316;border-radius:8px">{{mensaje}}</div>
    <p style="margin:20px 0 0;font-size:12px;color:#9ca3af">{{fecha}} · Respondé este email para escribirle directo.</p>
  </td></tr>
</table></td></tr></table></body></html>$tpl$
where key = 'contact_notify';

update public.email_templates set updated_at = now(), html = $tpl$<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>Te respondimos</title></head>
<body style="margin:0;padding:0;background:#f3f2f8">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">{{respuesta}}</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f2f8"><tr><td align="center" style="padding:32px 12px">
<table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;font-family:Arial,Helvetica,sans-serif;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(9,5,28,.08)">
  <tr><td style="background:#09051C;padding:32px 40px 28px;text-align:center">
    <img src="{{logo_soft}}" alt="Ninja Soft" height="30" style="display:block;margin:0 auto;height:30px;border:0" />
  </td></tr>
  <tr><td style="background:#ffffff;padding:40px 40px 8px;text-align:center">
    <div style="width:64px;height:64px;background:#fff1ea;border-radius:50%;margin:0 auto 20px;line-height:64px;text-align:center;font-size:28px">💬</div>
    <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#09051C">{{nombre}}, te respondimos</h1>
    <p style="margin:0;font-size:15px;color:#6b7280">Esto es lo que te escribió el equipo en el chat:</p>
  </td></tr>
  <tr><td style="background:#ffffff;padding:24px 40px 8px;font-size:15px;line-height:1.7;color:#374151">
    <div style="margin:0 0 24px;padding:16px 18px;background:#f9fafb;border-left:3px solid #f97316;border-radius:8px">{{respuesta}}</div>
    <p style="margin:0 0 28px;font-size:14px;color:#6b7280">Podés responder este email o seguir la conversación en la web.</p>
  </td></tr>
  <tr><td style="background:#ffffff;padding:0 40px 40px;text-align:center">
    <a href="{{link_sitio}}" style="display:inline-block;background:#f97316;background-image:linear-gradient(135deg,#ff4b22,#ff8a1f);color:#ffffff;text-decoration:none;font-weight:700;padding:15px 40px;border-radius:10px;font-size:15px;letter-spacing:.3px">Volver al chat →</a>
  </td></tr>
  <tr><td style="background:#09051C;padding:28px 40px 24px;text-align:center">
    <img src="{{logo_soft}}" alt="Ninja Soft" height="18" style="display:block;margin:0 auto 16px;height:18px;border:0" />
    <div style="height:1px;background:#1f2937;margin:0 0 16px"></div>
    <p style="color:#6b7280;font-size:11px;line-height:1.6;margin:0">Urquiza 3164 · Rosario, Santa Fe, Argentina</p>
  </td></tr>
</table></td></tr></table></body></html>$tpl$
where key = 'chat_reply';
