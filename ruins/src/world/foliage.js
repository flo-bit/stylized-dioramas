import * as THREE from 'three';
import { V, random, rand, pick, InstanceBatch, branch, patch, mossColors } from './geometry.js';
import { groundY, surfaceY, isPath } from './landscape.js';

function foldedLeaf(outline, ridge = .075) {
  const pos = [0, ridge, .47], index = [];
  for (const [x, z] of outline) pos.push(x, Math.sin(z * Math.PI) * .015, z);
  for (let i = 0; i < outline.length; i++) index.push(0, 1 + (i + 1) % outline.length, 1 + i);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(index); g.computeVertexNormals(); return g;
}
export function orientation(direction, twist = 0) {
  const z = direction.clone().normalize();
  const x = V(0, 1, 0).cross(z).normalize();
  if (x.lengthSq() < .01) x.set(1, 0, 0);
  const y = z.clone().cross(x).normalize();
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  if (twist) q.multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), twist));
  return q;
}

export class Foliage {
  constructor(scene, solid) {
    this.scene = scene; this.solid = solid; this.time = { value: 0 }; this.shaders = [];
    const material = new THREE.MeshStandardMaterial({ roughness: .93, side: THREE.DoubleSide, flatShading: true });
    material.onBeforeCompile = shader => {
      shader.uniforms.uWindTime = this.time;
      shader.vertexShader = 'uniform float uWindTime;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        #ifdef USE_INSTANCING
          float phase = instanceMatrix[3].x * 1.3 + instanceMatrix[3].z * 1.7;
          transformed.x += sin(uWindTime * 1.15 + phase) * 0.024 * position.z * position.z;
          transformed.y += cos(uWindTime * 0.8 + phase) * 0.012 * position.z;
        #endif`);
    };
    this.material = material;
    const oak = [[0,0],[-.19,.09],[-.17,.23],[-.36,.25],[-.38,.37],[-.25,.42],[-.44,.5],[-.39,.63],[-.24,.64],[-.28,.78],[-.18,.83],[-.12,.8],[0,1],[.13,.85],[.19,.88],[.3,.75],[.25,.65],[.39,.63],[.42,.5],[.27,.44],[.38,.35],[.3,.23],[.17,.26],[.2,.11]];
    const lance = [[0,0],[-.25,.18],[-.43,.4],[-.36,.64],[-.19,.84],[0,1],[.18,.86],[.32,.62],[.4,.38],[.24,.16]];
    const heart = [[0,0],[-.34,-.07],[-.5,.13],[-.43,.36],[-.26,.67],[0,1],[.26,.67],[.43,.36],[.5,.13],[.34,-.07]];
    this.oak = new InstanceBatch(foldedLeaf(oak, .06), material);
    this.leaf = new InstanceBatch(foldedLeaf(lance, .07), material);
    this.ivy = new InstanceBatch(foldedLeaf(heart, .045), material);
    const blade = new THREE.BufferGeometry(); blade.setAttribute('position', new THREE.Float32BufferAttribute([-.035,0,0,.035,0,0,.02,.32,.05,-.018,.32,.05,0,.6,.18],3)); blade.setIndex([0,1,2,0,2,3,3,2,4]); blade.computeVertexNormals();
    this.grass = new InstanceBatch(blade, material);
    this.petals = new InstanceBatch(foldedLeaf([[0,0],[-.35,.15],[-.48,.48],[-.3,.82],[0,1],[.3,.82],[.48,.48],[.35,.15]], .12), material);
    this.flowerCenters = new InstanceBatch(new THREE.IcosahedronGeometry(1,0), new THREE.MeshStandardMaterial({ roughness: .85, flatShading: true }));
  }
  fern(x, y, z, size = 1, count = 8, hue = 0) {
    const greens = hue ? ['#719824', '#8dab2f', '#94b532', '#6e902a'] : ['#507b2e', '#67932c', '#789d32', '#4f7f30', '#7fa536'];
    const rot = rand(0, Math.PI * 2);
    for (let f = 0; f < count; f++) {
      const angle = rot + f / count * Math.PI * 2 + rand(-.16,.16), length = size * rand(.66, 1.1);
      const dir = V(Math.cos(angle), 0, Math.sin(angle)), side = V(-dir.z,0,dir.x);
      const rise = rand(.53,.87);
      const point = t => V(x,y,z).addScaledVector(dir, length * Math.sin(t * 1.47)).add(V(0, length * (rise * Math.sin(t * 2.15) + .05), 0));
      const spine = [];
      for (let j=0;j<=7;j++) spine.push(point(j/7));
      branch(this.solid, spine, [.013 * size,.009*size,.002], '#688d32', 4, 9);
      const color = pick(greens);
      for (let j = 1; j < 13; j++) {
        const t = .11 + j * .065, p = point(t);
        const len = length * .36 * Math.pow(Math.sin(t * Math.PI), .83) * (1 - .28 * t);
        for (const sign of [-1,1]) {
          const direction = side.clone().multiplyScalar(sign).addScaledVector(dir, .48 + t * .6).add(V(0,.06 + .12 * (1-t),0));
          const pp = p.clone().addScaledVector(dir, sign === 1 ? .014 : -.014);
          this.leaf.add(pp, V(len * .57, len, len), orientation(direction, sign*.15), color);
        }
      }
      const end = point(.88); this.leaf.add(end, V(length*.06,length*.16,length*.19), orientation(dir.clone().add(V(0,-.3,0))), pick(greens));
    }
  }
  rosette(x,y,z,size=.5) {
    for(let j=0;j<7;j++) {
      const a=j/7*Math.PI*2+rand(-.25,.25), l=size*rand(.7,1.2);
      const d=V(Math.cos(a),rand(.45,1.65),Math.sin(a));
      this.leaf.add(V(x,y,z), V(l*.44,l,l),orientation(d,rand(-.35,.35)),pick(['#5e8d2e','#769a32','#477531','#8ba841']));
    }
  }
  trail({x,y,z,length=1, direction=0}) {
    const points=[], count=Math.ceil(length/.105), phase=rand(0,6);
    for(let j=0;j<=count;j++) {
      const t=j/count;
      points.push(V(x+Math.sin(t*6+phase)*.06+t*direction,y-t*length,z+.06*Math.sin(t*4)));
    }
    branch(this.solid,points,[.011,.008,.003],'#566832',5,count);
    for(let j=0;j<count;j++) {
      const p=points[j]; const s=rand(.12,.21)*(1-j/count*.35);
      for (const sign of [-1,1]) {
        if(random()<.17)continue;
        const d=V(sign*rand(.4,.8),rand(-.55,-.12),rand(.35,.8));
        this.ivy.add(p.clone().add(V(sign*.015,0,.01)),V(s*.83,s,s),orientation(d,rand(-.5,.5)),pick(['#658733','#77983a','#86a23c','#4e7735','#9aaa43']));
      }
    }
  }
  moss(x,y,z,radius=.3,amount=30) {
    for(let i=0;i<amount;i++) {
      const a=rand(0,6.283),r=radius*Math.sqrt(random()),s=rand(.045,.105);
      this.leaf.add(V(x+Math.cos(a)*r,y+rand(0,.025),z+Math.sin(a)*r),V(s*.8,s,s),V(rand(-.2,.2),rand(0,6.28),rand(-.15,.15)),pick(mossColors));
    }
  }
  flower(x,y,z,size=.5,orange=false) {
    const h=size*rand(.7,1.15), lean=rand(-.08,.08);
    branch(this.solid,[[x,y,z],[x+lean*.5,y+h*.5,z],[x+lean,y+h,z]], [.012,.007,.003], '#637d32',5,6);
    for(let j=1;j<4;j++) {
      const angle=j*2.4, len=h*.4;
      this.leaf.add(V(x+lean*j/4,y+h*j/5,z),V(len*.27,len,len),orientation(V(Math.cos(angle),.45,Math.sin(angle))), '#7c9a3a');
    }
    if(orange) {
      for(let j=0;j<8;j++) {
        const yy=y+h*(.58+j*.06),angle=j*2.399,s=size*(.105-j*.007);
        const p=V(x+lean+Math.cos(angle)*.035,yy,z+Math.sin(angle)*.035);
        this.flowerCenters.add(p,V(s*.65,s,s*.65),V(0,angle,.1),pick(['#d38539','#df9b48','#c87532']));
        this.petals.add(p,V(s,s,s*1.4),orientation(V(Math.cos(angle),.5,Math.sin(angle))), '#dc923d');
      }
    }else {
      const p=V(x+lean,y+h,z),s=size*.17;
      for(let k=0;k<5;k++) {
        const a=k/5*6.283;
        this.petals.add(p,V(s*.68,s,s),orientation(V(Math.cos(a),.2,Math.sin(a))),pick(['#b35b9a','#bf74ac','#a45c9d','#ce8fba']));
      }
      this.flowerCenters.add(p.clone().add(V(0,.016,0)),V(.018,.015,.018),V(),'#e5bb59');
    }
  }
  populate(architecture) {
    for(const vine of architecture.ivy) this.trail(vine);
    for(const {x,y,z,w,d} of architecture.mossSites) {
      for(let i=0;i<Math.ceil(w*d*65);i++) {
        const s=rand(.055,.13);
        this.oak.add(V(x+rand(-w*.46,w*.46),y+.025,z+rand(-d*.44,d*.44)),V(s,s,s),V(rand(-.22,.22),rand(0,6.28),rand(-.2,.2)),pick(['#6a8832','#79963a','#8b9d42','#54752d']));
      }
    }
    for(const p of architecture.planting) { this.moss(p.x,p.y+.025,p.z,.28,24); if(random()<.45)this.rosette(p.x,p.y,p.z,.26); }
    const ferns=[[-3.85,2.0,1.0],[-3.45,2.38,.62],[-2.7,3.22,.55],[-4.04,.85,.83],[-4.1,-.5,.65],[-3.73,-2.7,.6],[2.67,2.88,1.05],[2.04,2.87,.83],[2.0,3.53,.67],[3.75,1.35,1.07],[3.62,.4,.72],[4.04,-.65,.87],[2.9,-3.1,.66],[-2.48,3.76,.42],[.93,3.96,.45],[3.58,3.34,.46],[-4.25,3.12,.5],[-3.8,-3.25,.67],[-.9,-3.5,.45],[1.88,-3.25,.6]];
    for(const [x,z,s] of ferns) this.fern(x,groundY(x,z),z,s,Math.floor(rand(7,10)),random()<.5);
    const upper=[[-1.65,-.58,.56],[-1.96,.5,.43],[1.55,-1.9,.59],[1.7,.65,.42],[-2.9,-2.4,.58],[.2,-2.62,.57],[2.78,-.4,.54],[-2.7,1.4,.38]];
    for(const [x,z,s]of upper)this.fern(x,1.6,z,s,7,1);
    for(let i=0;i<130;i++) {
      const x=rand(-4.6,4.6),z=rand(-3.95,4.0);
      if(Math.abs(x)>4.3&&Math.abs(z)>3.65)continue;
      if(isPath(x,z)&&random()<.96)continue;
      const y=surfaceY(x,z); this.rosette(x,y,z,rand(.13,.32));
      if(i%3===0)this.moss(x,y+.01,z,.22,20);
    }
    // Broad-leaved understory fills the spaces between the more delicate ferns.
    for(let i=0;i<68;i++) {
      const x=rand(-4.55,4.55),z=rand(-3.9,3.9);
      if(Math.abs(x)<2.75 && z>-2.7 && z<3.8)continue;
      if(Math.abs(x)>4.25 && Math.abs(z)>3.6)continue;
      this.rosette(x,groundY(x,z),z,rand(.34,.67));
    }
    for(let i=0;i<3400;i++) {
      const x=rand(-4.65,4.65),z=rand(-3.95,4.0);
      if(Math.abs(x)>4.3&&Math.abs(z)>3.65)continue;
      if(isPath(x,z))continue;
      const y=surfaceY(x,z),s=rand(.045,.14);
      this.oak.add(V(x,y+.025,z),V(s,s,s),V(rand(-.3,.3),rand(0,6.28),rand(-.2,.2)),pick(['#5b7c2e','#779337','#6d8a32','#8c9e41']));
    }
    for(let i=0;i<3200;i++) {
      const x=rand(-4.74,4.74),z=rand(-4.08,4.08);
      if(Math.abs(x)>4.35&&Math.abs(z)>3.7)continue;
      if(isPath(x,z)&&random()<.97)continue;
      const y=surfaceY(x,z); const s=rand(.13,.38);
      this.grass.add(V(x,y,z),V(s*rand(.7,1.3),s,s),V(0,rand(0,6.28),rand(-.15,.15)),pick(['#6d8a34','#8d9e40','#79922d','#597d32','#9aab4b']));
    }
    const flowers=[[-4.02,2.75,.37,false],[-2.0,3.7,.35,false],[.98,3.71,.34,false],[-3.8,-2.6,.35,false],[3.66,2.11,.74,true],[2.84,3.49,.62,true]];
    for(const [x,z,s,orange]of flowers)for(let k=0;k<(orange?5:9);k++) {
      const xx=x+rand(-.22,.22),zz=z+rand(-.19,.19); this.flower(xx,groundY(xx,zz),zz,s*rand(.65,1.1),orange);
    }
    for(let i=0;i<17;i++) {
      const x=rand(-4.4,4.4),z=i%2?4.13:-4.12;
      if(Math.abs(x)<.9&&z>0)continue;
      this.trail({x,y:groundY(x,z),z,length:rand(.2,.65),direction:rand(-.1,.1)});
    }
    // A tiny cluster of ochre mushrooms at the foot of the tree.
    for(let i=0;i<7;i++) {
      const x=-3.2+rand(-.28,.28),z=2.1+rand(-.22,.22),y=groundY(x,z),h=rand(.07,.14);
      branch(this.solid,[[x,y,z],[x,y+h,z]],[.016,.01],'#cabd8e',5,2);
      const geo=new THREE.SphereGeometry(rand(.045,.073),7,3,0,Math.PI*2,0,Math.PI/2);
      this.solid.add(geo,V(x,y+h,z),'#c59b56',null,V(1,.5,1));geo.dispose();
    }
  }
  finish() {
    this.oak.finish(this.scene,true);this.leaf.finish(this.scene,true);this.ivy.finish(this.scene,true);this.grass.finish(this.scene,false);this.petals.finish(this.scene,false);this.flowerCenters.finish(this.scene,false);
  }
}
