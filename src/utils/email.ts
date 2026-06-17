import { Resend } from 'resend';

export const enviarRespuestaTicket = async (
  destinatario: string,
  ticketId: string,
  asunto: string,
  contenido: string
) => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: 'Soporte Sanos & Salvos <onboarding@resend.dev>',
    to: destinatario,
    subject: `Re: ${asunto} [Ticket #${ticketId.slice(0, 8)}]`,
    text: `Hola,\n\nHemos respondido tu ticket de soporte:\n\n${contenido}\n\nSaludos,\nEquipo de Soporte`,
    html: `
      <p>Hola,</p>
      <p>Hemos respondido tu ticket de soporte:</p>
      <blockquote style="border-left:3px solid #ccc;padding-left:12px;color:#555">
        ${contenido.replace(/\n/g, '<br>')}
      </blockquote>
      <p>Saludos,<br><strong>Equipo de Soporte</strong></p>
    `,
  });
};
