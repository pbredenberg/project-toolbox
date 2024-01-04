import { expect } from 'chai';
import { Hello } from '../src';

describe('hello', () => {
   expect(new Hello().sayHello()).to.be('hello, world!');
});
