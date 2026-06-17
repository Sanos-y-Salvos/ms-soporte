const mockSend = jest.fn().mockResolvedValue({ id: 'email-1' });
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

import { enviarRespuestaTicket } from '../../src/utils/email';
import { Resend } from 'resend';

describe('utils/email', () => {
  it('envía el correo con los datos correctos', async () => {
    process.env.RESEND_API_KEY = 'test-key';

    await enviarRespuestaTicket('dest@test.cl', 'ticket-uuid-123', 'Mi asunto', 'Hola usuario');

    expect(Resend).toHaveBeenCalledWith('test-key');
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'dest@test.cl',
        subject: 'Re: Mi asunto [Ticket #ticket-u]',
        from: expect.stringContaining('onboarding@resend.dev'),
      })
    );
  });
});
