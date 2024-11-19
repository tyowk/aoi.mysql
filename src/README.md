<div align="center"><h2>Installation</h2></div>

To get started with these `.ts` files, you first need to install TypeScript globally on your system. This allows you to use the TypeScript compiler (`tsc`) from any directory.
<br>
<br>

```bash
npm i -g typescript
```
<br>
<br>

> [!important]
> Ensure you have Node.js and npm installed. You can download them from [NodeJS.org](https://nodejs.org)
<br>
<br>
<div align="center"><h2>Building</h2></div>

Once you done, you need to compile it to JavaScript. This is done using the build command specified in [`package.json`](https://github.com/tyowk/aoi.mysql/blob/main/package.json#L19#L24) file.
<br>
<br>

```bash
npm run build
```
<br>
<br>
<br>

> [!note]
> The [`build`](https://github.com/tyowk/aoi.mysql/blob/main/package.json#L21) script typically compiles the TypeScript files in this project according to the settings in [`tsconfig.json`](https://github.com/tyowk/aoi.mysql/blob/main/tsconfig.json#L1#L17) and [`tscoesm.json`](https://github.com/tyowk/aoi.mysql/blob/main/tscoesm.json#L1#L9)