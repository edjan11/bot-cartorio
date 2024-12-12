

describe('Teste do Menu Principal', () => {
  let mockClient;
  let mockUserContext;

  beforeEach(() => {
    mockClient = {
      sendButtons: jest.fn(),
      sendText: jest.fn(),
    };
    mockUserContext = new Map();
  });

  it('Deve enviar botões no menu principal', async () => {
    const userId = '557998786100@c.us';
    await handleMenuPrincipal(mockClient, userId, null, mockUserContext);

    expect(mockClient.sendButtons).toHaveBeenCalledWith(
      userId,
      'Escolha uma das opções abaixo:',
      [{ body: 'Registro Civil' }, { body: 'Notas' }],
      'Menu Principal'
    );
  });

  it('Deve ir para o contexto de Registro Civil ao escolher "Registro Civil"', async () => {
    const userId = '557998786100@c.us';
    await handleMenuPrincipal(mockClient, userId, 'Registro Civil', mockUserContext);

    expect(mockUserContext.get(userId)).toBe('registroCivil');
  });

  it('Deve tratar respostas inválidas corretamente', async () => {
    const userId = '557998786100@c.us';
    await handleMenuPrincipal(mockClient, userId, 'Opção Inválida', mockUserContext);

    expect(mockClient.sendText).toHaveBeenCalledWith(
      userId,
      'Opção inválida. Escolha uma opção válida:'
    );
  });
});
