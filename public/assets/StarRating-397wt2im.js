import{c as n,r as m,j as e}from"./index-tJ82yWXv.js";/**
 * @license lucide-react v0.330.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const x=n("Star",[["polygon",{points:"12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2",key:"8f66p6"}]]);function p({value:r=0,onChange:o,readOnly:t=!1,size:i="md"}){const[c,a]=m.useState(0),l={sm:"w-4 h-4",md:"w-6 h-6",lg:"w-8 h-8"};return e.jsxs("div",{className:"flex items-center gap-1",children:[[1,2,3,4,5].map(s=>e.jsx("button",{type:"button",disabled:t,onClick:()=>!t&&(o==null?void 0:o(s)),onMouseEnter:()=>!t&&a(s),onMouseLeave:()=>!t&&a(0),className:`transition-transform duration-100 ${t?"cursor-default":"hover:scale-110 cursor-pointer"}`,children:e.jsx(x,{className:`${l[i]} transition-colors duration-150 ${s<=(c||r)?"fill-yellow-400 text-yellow-400":"fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"}`})},s)),r>0&&e.jsxs("span",{className:"ml-1.5 text-sm font-semibold text-gray-600 dark:text-gray-300",children:[r,"/5"]})]})}export{p as S,x as a};
