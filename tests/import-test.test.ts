console.log('Test file loaded');
import app from '../src/app';
console.log('App imported:', app ? 'yes' : 'no');

describe('Smoke', () => {
  it('should import app without hanging', () => {
    expect(app).toBeDefined();
  });
});
