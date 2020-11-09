import Arweave from 'arweave';
import { Pouch } from './src/pouch';

const arweave = Arweave.init({
  host: 'arweave.net',
  protocol: 'https',
  port: 443
});

(async () => {
  console.time('load');
  const pouch = new Pouch(arweave);
  const r = await pouch.getAccount('asdfasdf');
  const second = await pouch.getAccount('e4G1p1SRuZq3pLZi0lqZgSBRotKIGvlVDk4-bn_NkMQ');
  const third = await pouch.getAccount('mkXZ97yK5uPlm0uD3QY4CFD9cGav8fOt9IAG8hzOcgk');
  const fourth = await pouch.getAccount('BPr7vrFduuQqqVMu_tftxsScTKUq9ke0rx4q5C9ieQU');
  console.log(r);
  console.log(second);
  console.log(third);
  console.log(fourth);
  console.timeEnd('load');
  process.exit(0);
})();