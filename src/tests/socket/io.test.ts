import { setIo, getIo } from '../../socket/io';

describe('socket/io', () => {
  it('getIo retorna null antes de setIo', () => {
    expect(getIo()).toBeNull();
  });

  it('setIo almacena la instancia y getIo la retorna', () => {
    const fakeIo = {} as any;
    setIo(fakeIo);
    expect(getIo()).toBe(fakeIo);
  });
});
