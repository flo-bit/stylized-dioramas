import * as THREE from 'three';
import { V, random, rand, pick, branch, patch } from './geometry.js';

export function createTree(solid, foliage) {
  const treeStart = solid.parts.length;
  const foliageStarts = [foliage.oak, foliage.leaf, foliage.ivy].map(batch => batch.items.length);
  const bark = ['#665139','#76603e','#5b4b35','#806642','#6c5738'];
  const trunk = [[-2.69,1.53,-.8],[-2.86,2.1,-.95],[-2.7,2.9,-1.08],[-2.65,3.7,-1.14],[-2.92,4.52,-1.17],[-2.87,5.25,-1.28],[-2.64,6.25,-1.5]];
  branch(solid,trunk,[.62,.52,.42,.37,.3,.21,.07],'#695439',12,25);
  const limbs = [
    [[[-2.7,3.4,-1.1],[-2.2,4.19,-1.11],[-1.53,4.72,-1.15],[-1.1,5.52,-1.42],[-.89,6.25,-1.65]],[.35,.28,.18,.11,.025]],
    [[[-2.87,4.3,-1.19],[-3.43,4.9,-1.09],[-3.75,5.59,-1.09],[-4.23,6.14,-.99]],[.28,.22,.14,.035]],
    [[[-2.83,5.07,-1.29],[-2.31,5.54,-.69],[-2.05,6.06,-.22],[-1.63,6.38,-.13]],[.23,.17,.11,.025]],
    [[[-2.76,5.35,-1.32],[-3.02,6.03,-1.79],[-3.2,6.74,-2.02],[-3.1,7.08,-2.02]],[.2,.16,.1,.02]],
    [[[-2.82,2.53,-.87],[-3.27,3.04,-.7],[-3.85,3.27,-.42],[-4.13,3.8,-.3],[-4.15,4.15,-.3]],[.29,.22,.16,.09,.025]],
    [[[-3.74,5.56,-1.09],[-3.38,5.98,-.42],[-3.52,6.56,-.06]],[.12,.08,.02]],
    [[[-1.5,4.79,-1.18],[-1.79,5.38,-1.85],[-1.55,6.14,-2.22]],[.15,.1,.03]]
  ];
  for(const [points,radii]of limbs)branch(solid,points,radii,pick(bark),9,14);
  // Ribbons of raised grain follow the trunk's twist and split at its forks.
  for(let i=0;i<14;i++) {
    const a=i/14*Math.PI*2,points=[];
    for(let j=0;j<9;j++) {
      const t=j/8,h=1.6+t*3.82,r=.55-t*.31;
      const xx=-2.74+.12*Math.sin(t*6)-t*.06,zz=-.88-t*.38;
      points.push([xx+Math.cos(a+.23*Math.sin(t*5))*r,h,zz+Math.sin(a+.23*Math.sin(t*5))*r]);
    }
    branch(solid,points,[rand(.025,.055),.031,.014],pick(['#4f442f','#887048','#79613f','#51472f']),5,15);
  }
  const roots=[
    [[[-2.71,2.15,-.66],[-2.35,1.84,-.2],[-1.65,1.72,.16],[-1.1,1.7,.68],[-.78,1.65,1.22],[-.07,1.63,1.6]],[.29,.24,.19,.12,.065,.012]],
    [[[-2.48,1.96,-.72],[-1.96,1.69,-.49],[-1.4,1.66,-.5],[-.92,1.62,-.11],[-.6,1.6,.36]],[.24,.18,.12,.07,.009]],
    [[[-2.72,1.94,-.45],[-2.5,1.76,.15],[-2.27,1.72,.83],[-1.99,1.73,1.39],[-1.8,1.41,1.96],[-1.73,.64,2.29],[-1.36,.52,2.85]],[.29,.23,.17,.12,.09,.05,.008]],
    [[[-2.88,2.05,-.58],[-3.03,1.8,.13],[-3.18,1.71,.88],[-3.3,1.39,1.65],[-3.33,.85,1.98],[-3.59,.53,2.49],[-4.15,.53,2.77]],[.32,.24,.18,.14,.1,.05,.008]],
    [[[-3.07,1.86,-.81],[-3.41,1.63,-.45],[-3.64,1.06,-.06],[-3.83,.53,.51],[-4.24,.49,.98]],[.3,.23,.15,.085,.008]],
    [[[-2.97,1.96,-1.19],[-3.27,1.66,-1.58],[-3.46,1.59,-2.2],[-3.65,.8,-2.84],[-4.01,.47,-3.2]],[.29,.19,.1,.06,.01]],
    [[[-2.68,1.99,-1.3],[-2.18,1.73,-1.65],[-1.76,1.68,-2.09],[-1.31,1.59,-2.48]],[.22,.14,.07,.008]],
    [[[-2.55,1.89,-.82],[-1.96,1.71,-.01],[-1.8,1.65,.68],[-1.5,1.65,.91],[-1.18,1.64,1.43]],[.2,.14,.09,.05,.005]]
  ];
  for(const [points,radii]of roots) {
    branch(solid,points,radii,pick(bark),9,18);
    const highlight=points.map((p,i)=>[p[0]-.025,p[1]+radii[Math.min(i,radii.length-1)]*.82,p[2]+.015]);
    branch(solid,highlight,radii.map(r=>r*.12),'#947745',5,17);
  }
  const rootlets=[
    [[-1.55,1.71,.3],[-1.1,1.67,.05],[-.73,1.64,.19]],
    [[-2.22,1.77,.65],[-2.63,1.68,1.0],[-2.85,1.63,1.38]],
    [[-3.42,.7,2.19],[-3.06,.57,2.6],[-3.07,.52,3.15]],
    [[-1.83,.78,2.18],[-2.15,.57,2.43],[-2.21,.52,2.96]],
    [[-3.82,.57,.55],[-4.07,.5,.3],[-4.5,.46,.43]],
    [[-1.15,1.7,.67],[-.93,1.65,1.08],[-.31,1.63,1.1]]
  ];
  for(const p of rootlets)branch(solid,p,[.07,.04,.005],'#79613b',6,10);
  for(let i=0;i<14;i++) {
    const a=rand(0,6.28),r=rand(.37,.85);
    foliage.moss(-2.77+Math.cos(a)*r,1.61,-.9+Math.sin(a)*r,.17,17);
  }

  const crowns=[
    [-2.92,6.97,-1.47,1.3,.87,1.09],[-3.58,6.59,-1.02,1.08,.71,.89],[-4.1,6.14,-1.05,.83,.65,.8],
    [-2.3,6.55,-.51,1.13,.74,.99],[-1.34,6.1,-1.12,1.05,.7,.91],[-.97,6.39,-1.8,.81,.58,.81],
    [-1.87,6.68,-2.04,1.02,.69,.87],[-3.37,6.77,-2.14,1.05,.73,.94],[-3.52,6.19,-.08,.84,.57,.75],
    [-4.18,4.29,-.24,.88,.54,.74],[-4.45,4.16,.02,.53,.4,.52]
  ];
  for(let c=0;c<crowns.length;c++) {
    const [x,y,z,rx,ry,rz]=crowns[c];
    const core=new THREE.IcosahedronGeometry(1,2);
    solid.add(core,V(x,y-.13,z),pick(['#355b2c','#3c642c','#406a2b']),V(0,rand(0,6),0),V(rx*.91,ry*.79,rz*.91),.07);core.dispose();
    const count=Math.floor(rx*rz*570);
    for(let i=0;i<count;i++) {
      const a=rand(0,Math.PI*2),u=rand(-.83,1),r=Math.sqrt(1-u*u), shell=rand(.83,1.09);
      const p=V(x+Math.cos(a)*r*rx*shell,y+u*ry*shell,z+Math.sin(a)*r*rz*shell);
      const s=rand(.24,.43);
      const light=u*.55+(p.x-x)*-.1+rand(-.2,.2);
      const colors=light>.28?['#99b33c','#a4ba43','#8fae32','#aabd49']:light>-.1?['#759c31','#80a735','#6d942d','#86a535']:['#456f2b','#527e2b','#5e8a2d','#406a2b'];
      foliage.oak.add(p,V(s*rand(.9,1.35),s,s),V(rand(-.5,.5),rand(0,6.283),rand(-.4,.4)),pick(colors));
    }
  }
  // Fine twigs and pendulous ivy break the canopy's lower silhouette.
  for(const [x,y,z,len]of [[-4.38,4.0,.02,1.05],[-3.94,4.07,.25,.8],[-3.65,5.84,.25,.69],[-1.1,5.69,-.68,.6],[-4.19,5.64,-.87,.58],[-2.05,5.87,.12,.73]])foliage.trail({x,y,z,length:len});
  foliage.trail({x:-2.95,y:3.49,z:-.5,length:1.45,direction:.18});

  // A broad, low crown keeps the gate's silhouette distinct from the old tree.
  const treeTransform = new THREE.Matrix4().makeTranslation(-2.88,1.57,0)
    .multiply(new THREE.Matrix4().makeScale(1.06,.88,1))
    .multiply(new THREE.Matrix4().makeTranslation(2.7,-1.57,0));
  for(let i=treeStart;i<solid.parts.length;i++) solid.parts[i].applyMatrix4(treeTransform);
  [foliage.oak,foliage.leaf,foliage.ivy].forEach((batch,b)=>{
    for(let i=foliageStarts[b];i<batch.items.length;i++) batch.items[i].matrix.premultiply(treeTransform);
  });

  // A second, ancient climbing root stitches the arch back into the earth.
  const climbing=[
    [[2.24,.5,2.36],[2.22,.88,1.95],[2.62,1.53,1.36],[2.87,1.73,.55],[2.78,2.36,-.55],[2.69,3.25,-.92],[2.66,4.21,-1.0],[2.26,5.04,-1.01],[1.99,5.67,-1.08],[1.28,6.18,-1.31]],
    [[2.24,.51,2.36],[2.83,.51,2.7],[3.19,.51,3.02]],
    [[2.58,1.57,1.37],[2.18,1.61,1.47],[1.94,1.24,1.98],[1.98,.58,2.4],[1.71,.52,2.75]],
    [[2.76,2.3,-.5],[3.0,2.85,-1.12],[2.92,3.66,-1.24],[3.11,4.17,-1.45]]
  ];
  for(const path of climbing) for(const p of path) if(p[1]>3.2) p[1]+=.48*(p[1]-3.2)/2.98;
  branch(solid,climbing[0],[.19,.2,.18,.16,.145,.12,.105,.085,.06,.013],'#80633e',9,34);
  for(let i=1;i<climbing.length;i++)branch(solid,climbing[i],[.1,.07,.045,.017,.006],'#826440',7,16);
  const secondary=climbing[0].map((p,i)=>[p[0]+.1*Math.sin(i*1.8),p[1]+.02,p[2]+.12]);
  branch(solid,secondary,[.06,.07,.055,.05,.03,.008],'#a0844d',6,32);
  for(let i=0;i<7;i++)foliage.trail({x:2.65+rand(-.08,.1),y:2.2+i*.46,z:-.81,length:rand(.35,.58),direction:rand(-.24,.24)});
}
