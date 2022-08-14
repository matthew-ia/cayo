export default function main(arg) {
  console.log('hello, world');
  if (arg) console.log(arg);
  const some = [1,2,3,4,5];
  return some.at(-1);
}