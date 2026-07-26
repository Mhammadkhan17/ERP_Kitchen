import{B as _,l as q,a as u,c as p,b as o,m as C,r as D,d as U,z as Q,i as z,q as h,u as s,j as d,t as b,e as S,w as E,g as f,f as y,F,h as J,I as G,n as H,p as K,J as W}from"./index-BZddHLoJ.js";import{s as X,a as v}from"./index-DcE4BmF6.js";import{e as Y,c as O,s as k}from"./index-DGvFVRA8.js";import{s as Z}from"./index-BhZ62rr5.js";import{s as ee}from"./index-DCY1Ls2T.js";import{u as j,a as te,b as R,c as le}from"./useMenu-DiMEhQtq.js";import{a as ae,f as ne}from"./index-BeQKKqze.js";import{s as ie}from"./index-dpcNj_vg.js";import{s as T}from"./index-nmmT-I7r.js";import{r as M,p as se}from"./validators-DKfC8ku1.js";import"./index-O-FeDjC6.js";import"./useSnackbar-V9QKU82e.js";var oe=`
    .p-toggleswitch {
        display: inline-block;
        width: dt('toggleswitch.width');
        height: dt('toggleswitch.height');
    }

    .p-toggleswitch-input {
        cursor: pointer;
        appearance: none;
        position: absolute;
        top: 0;
        inset-inline-start: 0;
        width: 100%;
        height: 100%;
        padding: 0;
        margin: 0;
        opacity: 0;
        z-index: 1;
        outline: 0 none;
        border-radius: dt('toggleswitch.border.radius');
    }

    .p-toggleswitch-slider {
        cursor: pointer;
        width: 100%;
        height: 100%;
        border-width: dt('toggleswitch.border.width');
        border-style: solid;
        border-color: dt('toggleswitch.border.color');
        background: dt('toggleswitch.background');
        transition:
            background dt('toggleswitch.transition.duration'),
            color dt('toggleswitch.transition.duration'),
            border-color dt('toggleswitch.transition.duration'),
            outline-color dt('toggleswitch.transition.duration'),
            box-shadow dt('toggleswitch.transition.duration');
        border-radius: dt('toggleswitch.border.radius');
        outline-color: transparent;
        box-shadow: dt('toggleswitch.shadow');
    }

    .p-toggleswitch-handle {
        position: absolute;
        top: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        background: dt('toggleswitch.handle.background');
        color: dt('toggleswitch.handle.color');
        width: dt('toggleswitch.handle.size');
        height: dt('toggleswitch.handle.size');
        inset-inline-start: dt('toggleswitch.gap');
        margin-block-start: calc(-1 * calc(dt('toggleswitch.handle.size') / 2));
        border-radius: dt('toggleswitch.handle.border.radius');
        transition:
            background dt('toggleswitch.transition.duration'),
            color dt('toggleswitch.transition.duration'),
            inset-inline-start dt('toggleswitch.slide.duration'),
            box-shadow dt('toggleswitch.slide.duration');
    }

    .p-toggleswitch.p-toggleswitch-checked .p-toggleswitch-slider {
        background: dt('toggleswitch.checked.background');
        border-color: dt('toggleswitch.checked.border.color');
    }

    .p-toggleswitch.p-toggleswitch-checked .p-toggleswitch-handle {
        background: dt('toggleswitch.handle.checked.background');
        color: dt('toggleswitch.handle.checked.color');
        inset-inline-start: calc(dt('toggleswitch.width') - calc(dt('toggleswitch.handle.size') + dt('toggleswitch.gap')));
    }

    .p-toggleswitch:not(.p-disabled):has(.p-toggleswitch-input:hover) .p-toggleswitch-slider {
        background: dt('toggleswitch.hover.background');
        border-color: dt('toggleswitch.hover.border.color');
    }

    .p-toggleswitch:not(.p-disabled):has(.p-toggleswitch-input:hover) .p-toggleswitch-handle {
        background: dt('toggleswitch.handle.hover.background');
        color: dt('toggleswitch.handle.hover.color');
    }

    .p-toggleswitch:not(.p-disabled):has(.p-toggleswitch-input:hover).p-toggleswitch-checked .p-toggleswitch-slider {
        background: dt('toggleswitch.checked.hover.background');
        border-color: dt('toggleswitch.checked.hover.border.color');
    }

    .p-toggleswitch:not(.p-disabled):has(.p-toggleswitch-input:hover).p-toggleswitch-checked .p-toggleswitch-handle {
        background: dt('toggleswitch.handle.checked.hover.background');
        color: dt('toggleswitch.handle.checked.hover.color');
    }

    .p-toggleswitch:not(.p-disabled):has(.p-toggleswitch-input:focus-visible) .p-toggleswitch-slider {
        box-shadow: dt('toggleswitch.focus.ring.shadow');
        outline: dt('toggleswitch.focus.ring.width') dt('toggleswitch.focus.ring.style') dt('toggleswitch.focus.ring.color');
        outline-offset: dt('toggleswitch.focus.ring.offset');
    }

    .p-toggleswitch.p-invalid > .p-toggleswitch-slider {
        border-color: dt('toggleswitch.invalid.border.color');
    }

    .p-toggleswitch.p-disabled {
        opacity: 1;
    }

    .p-toggleswitch.p-disabled .p-toggleswitch-slider {
        background: dt('toggleswitch.disabled.background');
    }

    .p-toggleswitch.p-disabled .p-toggleswitch-handle {
        background: dt('toggleswitch.handle.disabled.background');
    }
`,de={root:{position:"relative"}},re={root:function(i){var r=i.instance,g=i.props;return["p-toggleswitch p-component",{"p-toggleswitch-checked":r.checked,"p-disabled":g.disabled,"p-invalid":r.$invalid}]},input:"p-toggleswitch-input",slider:"p-toggleswitch-slider",handle:"p-toggleswitch-handle"},ce=_.extend({name:"toggleswitch",style:oe,classes:re,inlineStyles:de}),ue={name:"BaseToggleSwitch",extends:Y,props:{trueValue:{type:null,default:!0},falseValue:{type:null,default:!1},readonly:{type:Boolean,default:!1},tabindex:{type:Number,default:null},inputId:{type:String,default:null},inputClass:{type:[String,Object],default:null},inputStyle:{type:Object,default:null},ariaLabelledby:{type:String,default:null},ariaLabel:{type:String,default:null}},style:ce,provide:function(){return{$pcToggleSwitch:this,$parentInstance:this}}},L={name:"ToggleSwitch",extends:ue,inheritAttrs:!1,emits:["change","focus","blur"],methods:{getPTOptions:function(i){var r=i==="root"?this.ptmi:this.ptm;return r(i,{context:{checked:this.checked,disabled:this.disabled}})},onChange:function(i){if(!this.disabled&&!this.readonly){var r=this.checked?this.falseValue:this.trueValue;this.writeValue(r,i),this.$emit("change",i)}},onFocus:function(i){this.$emit("focus",i)},onBlur:function(i){var r,g;this.$emit("blur",i),(r=(g=this.formField).onBlur)===null||r===void 0||r.call(g,i)}},computed:{checked:function(){return this.d_value===this.trueValue},dataP:function(){return q({checked:this.checked,disabled:this.disabled,invalid:this.$invalid})}}},ge=["data-p-checked","data-p-disabled","data-p"],pe=["id","checked","tabindex","disabled","readonly","aria-checked","aria-labelledby","aria-label","aria-invalid"],he=["data-p"],ve=["data-p"];function be(n,i,r,g,m,t){return u(),p("div",C({class:n.cx("root"),style:n.sx("root")},t.getPTOptions("root"),{"data-p-checked":t.checked,"data-p-disabled":n.disabled,"data-p":t.dataP}),[o("input",C({id:n.inputId,type:"checkbox",role:"switch",class:[n.cx("input"),n.inputClass],style:n.inputStyle,checked:t.checked,tabindex:n.tabindex,disabled:n.disabled,readonly:n.readonly,"aria-checked":t.checked,"aria-labelledby":n.ariaLabelledby,"aria-label":n.ariaLabel,"aria-invalid":n.invalid||void 0,onFocus:i[0]||(i[0]=function(){return t.onFocus&&t.onFocus.apply(t,arguments)}),onBlur:i[1]||(i[1]=function(){return t.onBlur&&t.onBlur.apply(t,arguments)}),onChange:i[2]||(i[2]=function(){return t.onChange&&t.onChange.apply(t,arguments)})},t.getPTOptions("input")),null,16,pe),o("div",C({class:n.cx("slider")},t.getPTOptions("slider"),{"data-p":t.dataP}),[o("div",C({class:n.cx("handle")},t.getPTOptions("handle"),{"data-p":t.dataP}),[D(n.$slots,"handle",{checked:t.checked})],16,ve)],16,he)],16,ge)}L.render=be;const me={class:"flex flex-col gap-1"},we={key:0,class:"text-red-500"},fe={class:"flex flex-col gap-1"},ye={key:0,class:"text-red-500"},ke={class:"flex flex-col gap-1"},xe={key:0,class:"text-red-500"},Ie={class:"flex flex-col gap-1"},Ve={key:0,class:"text-red-500"},$e={class:"flex items-center gap-2"},Ce={class:"flex justify-end gap-2 pt-2"},Se=U({__name:"MenuItemForm",props:{visible:{type:Boolean},menuItem:{}},emits:["close","saved"],setup(n,{emit:i}){const r=n,g=i,m=["starter","mains","desserts","beverages"],t=f({name:"",brandId:"",price:0,category:"",isActive:!0}),c=f({}),w=j(),A=y(()=>w.data.value??[]),x=te(),I=R(),B=y(()=>x.isPending.value||I.isPending.value);Q(()=>r.menuItem,a=>{a?t.value={name:a.name,brandId:a.brandId,price:a.price,category:a.category,isActive:a.isActive}:t.value={name:"",brandId:"",price:0,category:"",isActive:!0},c.value={}},{immediate:!0});function V(){const a={},e=M(t.value.name);e!==!0&&(a.name=e);const l=M(t.value.brandId);l!==!0&&(a.brandId=l);const $=se(t.value.price);$!==!0&&(a.price=$);const N=M(t.value.category);return N!==!0&&(a.category=N),c.value=a,Object.keys(a).length===0}async function P(){if(!V())return;const a={...t.value};r.menuItem?await I.mutateAsync({id:r.menuItem.id,data:a}):await x.mutateAsync(a),g("saved")}return(a,e)=>(u(),z(s(ae),{visible:n.visible,header:n.menuItem?"Edit Menu Item":"Add Menu Item",modal:!0,style:{width:"480px"},"onUpdate:visible":e[6]||(e[6]=l=>a.$emit("close"))},{default:h(()=>[o("form",{onSubmit:E(P,["prevent"]),class:"flex flex-col gap-4 p-4"},[o("div",me,[e[7]||(e[7]=o("label",{for:"name"},"Name",-1)),d(s(O),{id:"name",modelValue:t.value.name,"onUpdate:modelValue":e[0]||(e[0]=l=>t.value.name=l)},null,8,["modelValue"]),c.value.name?(u(),p("small",we,b(c.value.name),1)):S("",!0)]),o("div",fe,[e[8]||(e[8]=o("label",{for:"brand"},"Brand",-1)),d(s(T),{id:"brand",modelValue:t.value.brandId,"onUpdate:modelValue":e[1]||(e[1]=l=>t.value.brandId=l),options:A.value,"option-label":"name","option-value":"id",placeholder:"Select a brand",loading:s(w).isLoading.value,"show-clear":""},null,8,["modelValue","options","loading"]),c.value.brandId?(u(),p("small",ye,b(c.value.brandId),1)):S("",!0)]),o("div",ke,[e[9]||(e[9]=o("label",{for:"price"},"Price ($)",-1)),d(s(ie),{id:"price",modelValue:t.value.price,"onUpdate:modelValue":e[2]||(e[2]=l=>t.value.price=l),min:0,step:.01,"max-fraction-digits":2,placeholder:"0.00"},null,8,["modelValue"]),c.value.price?(u(),p("small",xe,b(c.value.price),1)):S("",!0)]),o("div",Ie,[e[10]||(e[10]=o("label",{for:"category"},"Category",-1)),d(s(T),{id:"category",modelValue:t.value.category,"onUpdate:modelValue":e[3]||(e[3]=l=>t.value.category=l),options:m,placeholder:"Select a category"},null,8,["modelValue"]),c.value.category?(u(),p("small",Ve,b(c.value.category),1)):S("",!0)]),o("div",$e,[d(s(L),{modelValue:t.value.isActive,"onUpdate:modelValue":e[4]||(e[4]=l=>t.value.isActive=l),"input-id":"isActive"},null,8,["modelValue"]),e[11]||(e[11]=o("label",{for:"isActive"},"Active",-1))]),o("div",Ce,[d(s(k),{type:"button",label:"Cancel",severity:"secondary",onClick:e[5]||(e[5]=l=>a.$emit("close"))}),d(s(k),{type:"submit",label:"Save",loading:B.value},null,8,["loading"])])],32)]),_:1},8,["visible","header"]))}}),Ae={class:"flex flex-col gap-4"},Be={class:"flex items-center justify-between"},Pe={class:"flex gap-2"},Me={class:"flex items-center gap-2"},Le={class:"p-input-icon-left flex-1"},Ne={key:0,class:"space-y-3"},Fe={key:1,class:"text-gray-400"},Te={class:"flex items-center gap-1"},He=U({__name:"MenuList",setup(n){W();const i=f(""),r=f(!1),g=f(null),m=le(),t=y(()=>m.data.value??[]),c=j(),w=y(()=>{const a={};for(const e of c.data.value??[])a[e.id]=e;return a}),A=R(),x=y(()=>{if(!i.value)return t.value;const a=i.value.toLowerCase();return t.value.filter(e=>e.name.toLowerCase().includes(a)||e.brandName.toLowerCase().includes(a)||e.category.toLowerCase().includes(a))});function I(a){return{starter:"info",mains:"success",desserts:"warn",beverages:"contrast"}[a]??null}function B(a){g.value=a,r.value=!0}function V(){r.value=!1,g.value=null}function P(a){A.mutate({id:a.id,data:{isActive:!a.isActive}})}return(a,e)=>(u(),p("div",Ae,[o("div",Be,[e[3]||(e[3]=o("h1",{class:"text-2xl font-bold text-gray-800"},"Menu Items",-1)),o("div",Pe,[d(s(k),{label:"Recipes",icon:"pi pi-book",severity:"secondary",onClick:e[0]||(e[0]=l=>a.$router.push("/menu/recipes"))}),d(s(k),{label:"Add Menu Item",icon:"pi pi-plus",onClick:e[1]||(e[1]=l=>r.value=!0)})])]),o("div",Me,[o("span",Le,[e[4]||(e[4]=o("i",{class:"pi pi-search"},null,-1)),d(s(O),{modelValue:i.value,"onUpdate:modelValue":e[2]||(e[2]=l=>i.value=l),placeholder:"Search menu items...",class:"w-full"},null,8,["modelValue"])])]),s(m).isLoading.value&&!t.value.length?(u(),p("div",Ne,[(u(),p(F,null,J(5,l=>o("div",{key:l,class:"flex gap-4"},[...e[5]||(e[5]=[G('<div class="skeleton-text flex-1 h-8"></div><div class="skeleton-text w-24 h-8"></div><div class="skeleton-text w-20 h-8"></div><div class="skeleton-text w-16 h-8"></div><div class="skeleton-text w-24 h-8"></div>',5)])])),64))])):(u(),p(F,{key:1},[d(s(X),{value:x.value,loading:s(m).isLoading.value,"striped-rows":"",size:"small",paginator:"",rows:20},{default:h(()=>[d(s(v),{field:"name",header:"Name",sortable:""}),d(s(v),{field:"brandName",header:"Brand",sortable:""},{body:h(({data:l})=>[w.value[l.brandId]?(u(),z(s(Z),{key:0,label:l.brandName,style:H({backgroundColor:w.value[l.brandId].color+"20",color:w.value[l.brandId].color}),class:"font-medium"},null,8,["label","style"])):(u(),p("span",Fe,b(l.brandName),1))]),_:1}),d(s(v),{field:"price",header:"Price",sortable:""},{body:h(({data:l})=>[K(b(s(ne)(l.price)),1)]),_:1}),d(s(v),{field:"category",header:"Category",sortable:""},{body:h(({data:l})=>[d(s(ee),{value:l.category,severity:I(l.category)},null,8,["value","severity"])]),_:1}),d(s(v),{field:"isActive",header:"Active",style:{width:"100px"}},{body:h(({data:l})=>[d(s(L),{"model-value":l.isActive,"onUpdate:modelValue":$=>P(l)},null,8,["model-value","onUpdate:modelValue"])]),_:1}),d(s(v),{field:"popularity",header:"Popularity",sortable:""},{body:h(({data:l})=>[o("div",Te,[e[6]||(e[6]=o("i",{class:"pi pi-star-fill text-yellow-500 text-xs"},null,-1)),o("span",null,b(l.popularity),1)])]),_:1}),d(s(v),{header:"Actions",style:{width:"100px"}},{body:h(({data:l})=>[d(s(k),{icon:"pi pi-pencil",severity:"secondary",size:"small",onClick:$=>B(l)},null,8,["onClick"])]),_:1})]),_:1},8,["value","loading"]),d(Se,{visible:r.value,"menu-item":g.value,onClose:V,onSaved:V},null,8,["visible","menu-item"])],64))]))}});export{He as default};
