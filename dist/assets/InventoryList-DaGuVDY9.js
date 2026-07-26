import{B as Z,s as ee,C as F,v as Q,a as c,i as L,x as M,q as y,r as $,j as a,m as w,b as i,c as f,F as V,y as _,k as P,e as x,t as h,d as q,z as ae,u as r,w as le,A as W,f as K,D as ce,R as de,l as ue,E as me,G as pe,T as ge,h as ne,p as H,H as fe,g as U,I as be,J as ve}from"./index-BZddHLoJ.js";import{s as ye,a as C}from"./index-DcE4BmF6.js";import{s as z,c as E}from"./index-DGvFVRA8.js";import{s as te,a as he,b as ke}from"./index-nmmT-I7r.js";import{s as we}from"./index-DCY1Ls2T.js";import{a as se,f as Se}from"./index-BeQKKqze.js";import{u as je,a as xe,b as Ce,c as $e}from"./useInventory-CcZo_uS3.js";import{s as A}from"./index-dpcNj_vg.js";import{r as Le,p as G}from"./validators-DKfC8ku1.js";import"./index-O-FeDjC6.js";import"./useSnackbar-V9QKU82e.js";var Pe=`
    .p-confirmdialog .p-dialog-content {
        display: flex;
        align-items: center;
        gap: dt('confirmdialog.content.gap');
    }

    .p-confirmdialog-icon {
        color: dt('confirmdialog.icon.color');
        font-size: dt('confirmdialog.icon.size');
        width: dt('confirmdialog.icon.size');
        height: dt('confirmdialog.icon.size');
    }
`,ze={root:"p-confirmdialog",icon:"p-confirmdialog-icon",message:"p-confirmdialog-message",pcRejectButton:"p-confirmdialog-reject-button",pcAcceptButton:"p-confirmdialog-accept-button"},Ie=Z.extend({name:"confirmdialog",style:Pe,classes:ze}),Ve={name:"BaseConfirmDialog",extends:ee,props:{group:String,breakpoints:{type:Object,default:null},draggable:{type:Boolean,default:!0}},style:Ie,provide:function(){return{$pcConfirmDialog:this,$parentInstance:this}}},oe={name:"ConfirmDialog",extends:Ve,confirmListener:null,closeListener:null,data:function(){return{visible:!1,confirmation:null}},mounted:function(){var n=this;this.confirmListener=function(t){t&&t.group===n.group&&(n.confirmation=t,n.confirmation.onShow&&n.confirmation.onShow(),n.visible=!0)},this.closeListener=function(){n.visible=!1,n.confirmation=null},F.on("confirm",this.confirmListener),F.on("close",this.closeListener)},beforeUnmount:function(){F.off("confirm",this.confirmListener),F.off("close",this.closeListener)},methods:{accept:function(){this.confirmation.accept&&this.confirmation.accept(),this.visible=!1},reject:function(){this.confirmation.reject&&this.confirmation.reject(),this.visible=!1},onHide:function(){this.confirmation.onHide&&this.confirmation.onHide(),this.visible=!1}},computed:{appendTo:function(){return this.confirmation?this.confirmation.appendTo:"body"},target:function(){return this.confirmation?this.confirmation.target:null},modal:function(){return this.confirmation?this.confirmation.modal==null?!0:this.confirmation.modal:!0},header:function(){return this.confirmation?this.confirmation.header:null},message:function(){return this.confirmation?this.confirmation.message:null},blockScroll:function(){return this.confirmation?this.confirmation.blockScroll:!0},position:function(){return this.confirmation?this.confirmation.position:null},acceptLabel:function(){if(this.confirmation){var n,t=this.confirmation;return t.acceptLabel||((n=t.acceptProps)===null||n===void 0?void 0:n.label)||this.$primevue.config.locale.accept}return this.$primevue.config.locale.accept},rejectLabel:function(){if(this.confirmation){var n,t=this.confirmation;return t.rejectLabel||((n=t.rejectProps)===null||n===void 0?void 0:n.label)||this.$primevue.config.locale.reject}return this.$primevue.config.locale.reject},acceptIcon:function(){var n;return this.confirmation?this.confirmation.acceptIcon:(n=this.confirmation)!==null&&n!==void 0&&n.acceptProps?this.confirmation.acceptProps.icon:null},rejectIcon:function(){var n;return this.confirmation?this.confirmation.rejectIcon:(n=this.confirmation)!==null&&n!==void 0&&n.rejectProps?this.confirmation.rejectProps.icon:null},autoFocusAccept:function(){return this.confirmation.defaultFocus===void 0||this.confirmation.defaultFocus==="accept"},autoFocusReject:function(){return this.confirmation.defaultFocus==="reject"},closeOnEscape:function(){return this.confirmation?this.confirmation.closeOnEscape:!0}},components:{Dialog:se,Button:z}};function Oe(e,n,t,d,m,s){var l=Q("Button"),u=Q("Dialog");return c(),L(u,{visible:m.visible,"onUpdate:visible":[n[2]||(n[2]=function(b){return m.visible=b}),s.onHide],role:"alertdialog",class:P(e.cx("root")),modal:s.modal,header:s.header,blockScroll:s.blockScroll,appendTo:s.appendTo,position:s.position,breakpoints:e.breakpoints,closeOnEscape:s.closeOnEscape,draggable:e.draggable,pt:e.pt,unstyled:e.unstyled},M({default:y(function(){return[e.$slots.container?x("",!0):(c(),f(V,{key:0},[e.$slots.message?(c(),L(_(e.$slots.message),{key:1,message:m.confirmation},null,8,["message"])):(c(),f(V,{key:0},[$(e.$slots,"icon",{},function(){return[e.$slots.icon?(c(),L(_(e.$slots.icon),{key:0,class:P(e.cx("icon"))},null,8,["class"])):m.confirmation.icon?(c(),f("span",w({key:1,class:[m.confirmation.icon,e.cx("icon")]},e.ptm("icon")),null,16)):x("",!0)]}),i("span",w({class:e.cx("message")},e.ptm("message")),h(s.message),17)],64))],64))]}),_:2},[e.$slots.container?{name:"container",fn:y(function(b){return[$(e.$slots,"container",{message:m.confirmation,closeCallback:b.closeCallback,acceptCallback:s.accept,rejectCallback:s.reject,initDragCallback:b.initDragCallback})]}),key:"0"}:void 0,e.$slots.container?void 0:{name:"footer",fn:y(function(){var b;return[a(l,w({class:[e.cx("pcRejectButton"),m.confirmation.rejectClass],autofocus:s.autoFocusReject,unstyled:e.unstyled,text:((b=m.confirmation.rejectProps)===null||b===void 0?void 0:b.text)||!1,onClick:n[0]||(n[0]=function(j){return s.reject()})},m.confirmation.rejectProps,{label:s.rejectLabel,pt:e.ptm("pcRejectButton")}),M({_:2},[s.rejectIcon||e.$slots.rejecticon?{name:"icon",fn:y(function(j){return[$(e.$slots,"rejecticon",{},function(){return[i("span",w({class:[s.rejectIcon,j.class]},e.ptm("pcRejectButton").icon,{"data-pc-section":"rejectbuttonicon"}),null,16)]})]}),key:"0"}:void 0]),1040,["class","autofocus","unstyled","text","label","pt"]),a(l,w({label:s.acceptLabel,class:[e.cx("pcAcceptButton"),m.confirmation.acceptClass],autofocus:s.autoFocusAccept,unstyled:e.unstyled,onClick:n[1]||(n[1]=function(j){return s.accept()})},m.confirmation.acceptProps,{pt:e.ptm("pcAcceptButton")}),M({_:2},[s.acceptIcon||e.$slots.accepticon?{name:"icon",fn:y(function(j){return[$(e.$slots,"accepticon",{},function(){return[i("span",w({class:[s.acceptIcon,j.class]},e.ptm("pcAcceptButton").icon,{"data-pc-section":"acceptbuttonicon"}),null,16)]})]}),key:"0"}:void 0]),1040,["label","class","autofocus","unstyled","pt"])]}),key:"1"}]),1032,["visible","class","modal","header","blockScroll","appendTo","position","breakpoints","closeOnEscape","draggable","onUpdate:visible","pt","unstyled"])}oe.render=Oe;const De={class:"field"},Be={key:0,class:"text-red-500"},Fe={class:"grid grid-cols-2 gap-4"},Ue={class:"field"},Ae={key:0,class:"text-red-500"},Ee={class:"field"},Re={class:"grid grid-cols-2 gap-4"},Te={class:"field"},Ne={key:0,class:"text-red-500"},Me={class:"field"},Qe={key:0,class:"text-red-500"},_e={class:"grid grid-cols-2 gap-4"},He={class:"field"},qe={class:"field"},Ke={class:"field"},We={class:"flex gap-2 justify-end pt-2 border-t border-gray-200"},Ge=q({__name:"IngredientForm",props:{visible:{type:Boolean},ingredient:{}},emits:["close","saved"],setup(e,{emit:n}){const t=e,d=n,m=["kg","g","L","mL","pcs"],s=()=>({name:"",unit:"kg",currentStock:0,reorderLevel:0,reorderQty:0,unitCost:0,supplier:"",category:""}),l=W(s()),u=W({});ae(()=>t.visible,k=>{k&&t.ingredient?Object.assign(l,{name:t.ingredient.name,unit:t.ingredient.unit,currentStock:t.ingredient.currentStock,reorderLevel:t.ingredient.reorderLevel,reorderQty:t.ingredient.reorderQty,unitCost:t.ingredient.unitCost,supplier:t.ingredient.supplier,category:t.ingredient.category}):k&&Object.assign(l,s()),Object.keys(u).forEach(o=>u[o]=null)});const b=je(),j=xe(),R=K(()=>b.isPending.value||j.isPending.value);function T(){let k=!0;const o={name:l.name,unit:l.unit,currentStock:l.currentStock,reorderLevel:l.reorderLevel};Object.entries(o).forEach(([v,S])=>{const I=Le(S);I!==!0?(u[v]=I,k=!1):u[v]=null});const p=G(l.currentStock);p!==!0&&(u.currentStock=p,k=!1);const B=G(l.reorderLevel);return B!==!0&&(u.reorderLevel=B,k=!1),k}async function N(){if(!T())return;const k={...l};t.ingredient?await j.mutateAsync({id:t.ingredient.id,data:k}):await b.mutateAsync(k),d("saved")}return(k,o)=>(c(),L(r(se),{visible:e.visible,header:e.ingredient?"Edit Ingredient":"Add Ingredient",modal:!0,closable:!1,style:{width:"520px"},"onUpdate:visible":o[9]||(o[9]=p=>k.$emit("close"))},{default:y(()=>[i("form",{onSubmit:le(N,["prevent"]),class:"flex flex-col gap-4"},[i("div",De,[o[10]||(o[10]=i("label",{for:"name",class:"font-medium text-sm text-gray-700 mb-1 block"},"Name",-1)),a(r(E),{id:"name",modelValue:l.name,"onUpdate:modelValue":o[0]||(o[0]=p=>l.name=p),class:P(["w-full",{"p-invalid":u.name}])},null,8,["modelValue","class"]),u.name?(c(),f("small",Be,h(u.name),1)):x("",!0)]),i("div",Fe,[i("div",Ue,[o[11]||(o[11]=i("label",{for:"unit",class:"font-medium text-sm text-gray-700 mb-1 block"},"Unit",-1)),a(r(te),{id:"unit",modelValue:l.unit,"onUpdate:modelValue":o[1]||(o[1]=p=>l.unit=p),options:m,class:P(["w-full",{"p-invalid":u.unit}])},null,8,["modelValue","class"]),u.unit?(c(),f("small",Ae,h(u.unit),1)):x("",!0)]),i("div",Ee,[o[12]||(o[12]=i("label",{for:"category",class:"font-medium text-sm text-gray-700 mb-1 block"},"Category",-1)),a(r(E),{id:"category",modelValue:l.category,"onUpdate:modelValue":o[2]||(o[2]=p=>l.category=p),class:"w-full"},null,8,["modelValue"])])]),i("div",Re,[i("div",Te,[o[13]||(o[13]=i("label",{for:"currentStock",class:"font-medium text-sm text-gray-700 mb-1 block"},"Current Stock",-1)),a(r(A),{id:"currentStock",modelValue:l.currentStock,"onUpdate:modelValue":o[3]||(o[3]=p=>l.currentStock=p),min:0,minFractionDigits:0,maxFractionDigits:3,class:P(["w-full",{"p-invalid":u.currentStock}])},null,8,["modelValue","class"]),u.currentStock?(c(),f("small",Ne,h(u.currentStock),1)):x("",!0)]),i("div",Me,[o[14]||(o[14]=i("label",{for:"reorderLevel",class:"font-medium text-sm text-gray-700 mb-1 block"},"Reorder Level",-1)),a(r(A),{id:"reorderLevel",modelValue:l.reorderLevel,"onUpdate:modelValue":o[4]||(o[4]=p=>l.reorderLevel=p),min:0,minFractionDigits:0,maxFractionDigits:3,class:P(["w-full",{"p-invalid":u.reorderLevel}])},null,8,["modelValue","class"]),u.reorderLevel?(c(),f("small",Qe,h(u.reorderLevel),1)):x("",!0)])]),i("div",_e,[i("div",He,[o[15]||(o[15]=i("label",{for:"reorderQty",class:"font-medium text-sm text-gray-700 mb-1 block"},"Reorder Qty",-1)),a(r(A),{id:"reorderQty",modelValue:l.reorderQty,"onUpdate:modelValue":o[5]||(o[5]=p=>l.reorderQty=p),min:0,minFractionDigits:0,maxFractionDigits:3,class:"w-full"},null,8,["modelValue"])]),i("div",qe,[o[16]||(o[16]=i("label",{for:"unitCost",class:"font-medium text-sm text-gray-700 mb-1 block"},"Unit Cost",-1)),a(r(A),{id:"unitCost",modelValue:l.unitCost,"onUpdate:modelValue":o[6]||(o[6]=p=>l.unitCost=p),min:0,minFractionDigits:2,maxFractionDigits:2,prefix:"$",class:"w-full"},null,8,["modelValue"])])]),i("div",Ke,[o[17]||(o[17]=i("label",{for:"supplier",class:"font-medium text-sm text-gray-700 mb-1 block"},"Supplier",-1)),a(r(E),{id:"supplier",modelValue:l.supplier,"onUpdate:modelValue":o[7]||(o[7]=p=>l.supplier=p),class:"w-full"},null,8,["modelValue"])]),i("div",We,[a(r(z),{type:"button",label:"Cancel",severity:"secondary",onClick:o[8]||(o[8]=p=>k.$emit("close"))}),a(r(z),{type:"submit",label:"Save",loading:R.value},null,8,["loading"])])],32)]),_:1},8,["visible","header"]))}});var Je=`
    .p-message {
        display: grid;
        grid-template-rows: 1fr;
        border-radius: dt('message.border.radius');
        outline-width: dt('message.border.width');
        outline-style: solid;
    }

    .p-message-content-wrapper {
        min-height: 0;
    }

    .p-message-content {
        display: flex;
        align-items: center;
        padding: dt('message.content.padding');
        gap: dt('message.content.gap');
    }

    .p-message-icon {
        flex-shrink: 0;
    }

    .p-message-close-button {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        margin-inline-start: auto;
        overflow: hidden;
        position: relative;
        width: dt('message.close.button.width');
        height: dt('message.close.button.height');
        border-radius: dt('message.close.button.border.radius');
        background: transparent;
        transition:
            background dt('message.transition.duration'),
            color dt('message.transition.duration'),
            outline-color dt('message.transition.duration'),
            box-shadow dt('message.transition.duration'),
            opacity 0.3s;
        outline-color: transparent;
        color: inherit;
        padding: 0;
        border: none;
        cursor: pointer;
        user-select: none;
    }

    .p-message-close-icon {
        font-size: dt('message.close.icon.size');
        width: dt('message.close.icon.size');
        height: dt('message.close.icon.size');
    }

    .p-message-close-button:focus-visible {
        outline-width: dt('message.close.button.focus.ring.width');
        outline-style: dt('message.close.button.focus.ring.style');
        outline-offset: dt('message.close.button.focus.ring.offset');
    }

    .p-message-info {
        background: dt('message.info.background');
        outline-color: dt('message.info.border.color');
        color: dt('message.info.color');
        box-shadow: dt('message.info.shadow');
    }

    .p-message-info .p-message-close-button:focus-visible {
        outline-color: dt('message.info.close.button.focus.ring.color');
        box-shadow: dt('message.info.close.button.focus.ring.shadow');
    }

    .p-message-info .p-message-close-button:hover {
        background: dt('message.info.close.button.hover.background');
    }

    .p-message-info.p-message-outlined {
        color: dt('message.info.outlined.color');
        outline-color: dt('message.info.outlined.border.color');
    }

    .p-message-info.p-message-simple {
        color: dt('message.info.simple.color');
    }

    .p-message-success {
        background: dt('message.success.background');
        outline-color: dt('message.success.border.color');
        color: dt('message.success.color');
        box-shadow: dt('message.success.shadow');
    }

    .p-message-success .p-message-close-button:focus-visible {
        outline-color: dt('message.success.close.button.focus.ring.color');
        box-shadow: dt('message.success.close.button.focus.ring.shadow');
    }

    .p-message-success .p-message-close-button:hover {
        background: dt('message.success.close.button.hover.background');
    }

    .p-message-success.p-message-outlined {
        color: dt('message.success.outlined.color');
        outline-color: dt('message.success.outlined.border.color');
    }

    .p-message-success.p-message-simple {
        color: dt('message.success.simple.color');
    }

    .p-message-warn {
        background: dt('message.warn.background');
        outline-color: dt('message.warn.border.color');
        color: dt('message.warn.color');
        box-shadow: dt('message.warn.shadow');
    }

    .p-message-warn .p-message-close-button:focus-visible {
        outline-color: dt('message.warn.close.button.focus.ring.color');
        box-shadow: dt('message.warn.close.button.focus.ring.shadow');
    }

    .p-message-warn .p-message-close-button:hover {
        background: dt('message.warn.close.button.hover.background');
    }

    .p-message-warn.p-message-outlined {
        color: dt('message.warn.outlined.color');
        outline-color: dt('message.warn.outlined.border.color');
    }

    .p-message-warn.p-message-simple {
        color: dt('message.warn.simple.color');
    }

    .p-message-error {
        background: dt('message.error.background');
        outline-color: dt('message.error.border.color');
        color: dt('message.error.color');
        box-shadow: dt('message.error.shadow');
    }

    .p-message-error .p-message-close-button:focus-visible {
        outline-color: dt('message.error.close.button.focus.ring.color');
        box-shadow: dt('message.error.close.button.focus.ring.shadow');
    }

    .p-message-error .p-message-close-button:hover {
        background: dt('message.error.close.button.hover.background');
    }

    .p-message-error.p-message-outlined {
        color: dt('message.error.outlined.color');
        outline-color: dt('message.error.outlined.border.color');
    }

    .p-message-error.p-message-simple {
        color: dt('message.error.simple.color');
    }

    .p-message-secondary {
        background: dt('message.secondary.background');
        outline-color: dt('message.secondary.border.color');
        color: dt('message.secondary.color');
        box-shadow: dt('message.secondary.shadow');
    }

    .p-message-secondary .p-message-close-button:focus-visible {
        outline-color: dt('message.secondary.close.button.focus.ring.color');
        box-shadow: dt('message.secondary.close.button.focus.ring.shadow');
    }

    .p-message-secondary .p-message-close-button:hover {
        background: dt('message.secondary.close.button.hover.background');
    }

    .p-message-secondary.p-message-outlined {
        color: dt('message.secondary.outlined.color');
        outline-color: dt('message.secondary.outlined.border.color');
    }

    .p-message-secondary.p-message-simple {
        color: dt('message.secondary.simple.color');
    }

    .p-message-contrast {
        background: dt('message.contrast.background');
        outline-color: dt('message.contrast.border.color');
        color: dt('message.contrast.color');
        box-shadow: dt('message.contrast.shadow');
    }

    .p-message-contrast .p-message-close-button:focus-visible {
        outline-color: dt('message.contrast.close.button.focus.ring.color');
        box-shadow: dt('message.contrast.close.button.focus.ring.shadow');
    }

    .p-message-contrast .p-message-close-button:hover {
        background: dt('message.contrast.close.button.hover.background');
    }

    .p-message-contrast.p-message-outlined {
        color: dt('message.contrast.outlined.color');
        outline-color: dt('message.contrast.outlined.border.color');
    }

    .p-message-contrast.p-message-simple {
        color: dt('message.contrast.simple.color');
    }

    .p-message-text {
        font-size: dt('message.text.font.size');
        font-weight: dt('message.text.font.weight');
    }

    .p-message-icon {
        font-size: dt('message.icon.size');
        width: dt('message.icon.size');
        height: dt('message.icon.size');
    }

    .p-message-sm .p-message-content {
        padding: dt('message.content.sm.padding');
    }

    .p-message-sm .p-message-text {
        font-size: dt('message.text.sm.font.size');
    }

    .p-message-sm .p-message-icon {
        font-size: dt('message.icon.sm.size');
        width: dt('message.icon.sm.size');
        height: dt('message.icon.sm.size');
    }

    .p-message-sm .p-message-close-icon {
        font-size: dt('message.close.icon.sm.size');
        width: dt('message.close.icon.sm.size');
        height: dt('message.close.icon.sm.size');
    }

    .p-message-lg .p-message-content {
        padding: dt('message.content.lg.padding');
    }

    .p-message-lg .p-message-text {
        font-size: dt('message.text.lg.font.size');
    }

    .p-message-lg .p-message-icon {
        font-size: dt('message.icon.lg.size');
        width: dt('message.icon.lg.size');
        height: dt('message.icon.lg.size');
    }

    .p-message-lg .p-message-close-icon {
        font-size: dt('message.close.icon.lg.size');
        width: dt('message.close.icon.lg.size');
        height: dt('message.close.icon.lg.size');
    }

    .p-message-outlined {
        background: transparent;
        outline-width: dt('message.outlined.border.width');
    }

    .p-message-simple {
        background: transparent;
        outline-color: transparent;
        box-shadow: none;
    }

    .p-message-simple .p-message-content {
        padding: dt('message.simple.content.padding');
    }

    .p-message-outlined .p-message-close-button:hover,
    .p-message-simple .p-message-close-button:hover {
        background: transparent;
    }

    .p-message-enter-active {
        animation: p-animate-message-enter 0.3s ease-out forwards;
        overflow: hidden;
    }

    .p-message-leave-active {
        animation: p-animate-message-leave 0.15s ease-in forwards;
        overflow: hidden;
    }

    @keyframes p-animate-message-enter {
        from {
            opacity: 0;
            grid-template-rows: 0fr;
        }
        to {
            opacity: 1;
            grid-template-rows: 1fr;
        }
    }

    @keyframes p-animate-message-leave {
        from {
            opacity: 1;
            grid-template-rows: 1fr;
        }
        to {
            opacity: 0;
            margin: 0;
            grid-template-rows: 0fr;
        }
    }
`,Xe={root:function(n){var t=n.props;return["p-message p-component p-message-"+t.severity,{"p-message-outlined":t.variant==="outlined","p-message-simple":t.variant==="simple","p-message-sm":t.size==="small","p-message-lg":t.size==="large"}]},contentWrapper:"p-message-content-wrapper",content:"p-message-content",icon:"p-message-icon",text:"p-message-text",closeButton:"p-message-close-button",closeIcon:"p-message-close-icon"},Ye=Z.extend({name:"message",style:Je,classes:Xe}),Ze={name:"BaseMessage",extends:ee,props:{severity:{type:String,default:"info"},closable:{type:Boolean,default:!1},life:{type:Number,default:null},icon:{type:String,default:void 0},closeIcon:{type:String,default:void 0},closeButtonProps:{type:null,default:null},size:{type:String,default:null},variant:{type:String,default:null}},style:Ye,provide:function(){return{$pcMessage:this,$parentInstance:this}}};function O(e){"@babel/helpers - typeof";return O=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(n){return typeof n}:function(n){return n&&typeof Symbol=="function"&&n.constructor===Symbol&&n!==Symbol.prototype?"symbol":typeof n},O(e)}function J(e,n,t){return(n=en(n))in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function en(e){var n=nn(e,"string");return O(n)=="symbol"?n:n+""}function nn(e,n){if(O(e)!="object"||!e)return e;var t=e[Symbol.toPrimitive];if(t!==void 0){var d=t.call(e,n);if(O(d)!="object")return d;throw new TypeError("@@toPrimitive must return a primitive value.")}return(n==="string"?String:Number)(e)}var re={name:"Message",extends:Ze,inheritAttrs:!1,emits:["close","life-end"],timeout:null,data:function(){return{visible:!0}},mounted:function(){var n=this;this.life&&setTimeout(function(){n.visible=!1,n.$emit("life-end")},this.life)},methods:{close:function(n){this.visible=!1,this.$emit("close",n)}},computed:{closeAriaLabel:function(){return this.$primevue.config.locale.aria?this.$primevue.config.locale.aria.close:void 0},dataP:function(){return ue(J(J({outlined:this.variant==="outlined",simple:this.variant==="simple"},this.severity,this.severity),this.size,this.size))}},directives:{ripple:de},components:{TimesIcon:ce}};function D(e){"@babel/helpers - typeof";return D=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(n){return typeof n}:function(n){return n&&typeof Symbol=="function"&&n.constructor===Symbol&&n!==Symbol.prototype?"symbol":typeof n},D(e)}function X(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var d=Object.getOwnPropertySymbols(e);n&&(d=d.filter(function(m){return Object.getOwnPropertyDescriptor(e,m).enumerable})),t.push.apply(t,d)}return t}function Y(e){for(var n=1;n<arguments.length;n++){var t=arguments[n]!=null?arguments[n]:{};n%2?X(Object(t),!0).forEach(function(d){tn(e,d,t[d])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):X(Object(t)).forEach(function(d){Object.defineProperty(e,d,Object.getOwnPropertyDescriptor(t,d))})}return e}function tn(e,n,t){return(n=sn(n))in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function sn(e){var n=on(e,"string");return D(n)=="symbol"?n:n+""}function on(e,n){if(D(e)!="object"||!e)return e;var t=e[Symbol.toPrimitive];if(t!==void 0){var d=t.call(e,n);if(D(d)!="object")return d;throw new TypeError("@@toPrimitive must return a primitive value.")}return(n==="string"?String:Number)(e)}var rn=["data-p"],an=["data-p"],ln=["data-p"],cn=["aria-label","data-p"],dn=["data-p"];function un(e,n,t,d,m,s){var l=Q("TimesIcon"),u=me("ripple");return c(),L(ge,w({name:"p-message",appear:""},e.ptmi("transition")),{default:y(function(){return[m.visible?(c(),f("div",w({key:0,class:e.cx("root"),role:"alert","aria-live":"assertive","aria-atomic":"true","data-p":s.dataP},e.ptm("root")),[i("div",w({class:e.cx("contentWrapper")},e.ptm("contentWrapper")),[e.$slots.container?$(e.$slots,"container",{key:0,closeCallback:s.close}):(c(),f("div",w({key:1,class:e.cx("content"),"data-p":s.dataP},e.ptm("content")),[$(e.$slots,"icon",{class:P(e.cx("icon"))},function(){return[(c(),L(_(e.icon?"span":null),w({class:[e.cx("icon"),e.icon],"data-p":s.dataP},e.ptm("icon")),null,16,["class","data-p"]))]}),e.$slots.default?(c(),f("div",w({key:0,class:e.cx("text"),"data-p":s.dataP},e.ptm("text")),[$(e.$slots,"default")],16,ln)):x("",!0),e.closable?pe((c(),f("button",w({key:1,class:e.cx("closeButton"),"aria-label":s.closeAriaLabel,type:"button",onClick:n[0]||(n[0]=function(b){return s.close(b)}),"data-p":s.dataP},Y(Y({},e.closeButtonProps),e.ptm("closeButton"))),[$(e.$slots,"closeicon",{},function(){return[e.closeIcon?(c(),f("i",w({key:0,class:[e.cx("closeIcon"),e.closeIcon],"data-p":s.dataP},e.ptm("closeIcon")),null,16,dn)):(c(),L(l,w({key:1,class:[e.cx("closeIcon"),e.closeIcon],"data-p":s.dataP},e.ptm("closeIcon")),null,16,["class","data-p"]))]})],16,cn)),[[u]]):x("",!0)],16,an))],16)],16,rn)):x("",!0)]}),_:3},16)}re.render=un;const mn={key:0,class:"mb-4"},pn={class:"flex flex-col gap-1"},gn={class:"font-semibold text-sm"},fn={class:"text-sm mt-1 space-y-0.5"},bn={class:"font-medium"},vn={class:"text-gray-500 text-xs"},yn=q({__name:"LowStockBanner",props:{ingredients:{}},setup(e){const n=e,t=K(()=>n.ingredients.filter(d=>d.currentStock<=d.reorderLevel));return(d,m)=>t.value.length>0?(c(),f("div",mn,[a(r(re),{severity:"warn",closable:!1},{default:y(()=>[i("div",pn,[i("span",gn," Low Stock Alert — "+h(t.value.length)+" item"+h(t.value.length===1?"":"s"),1),i("ul",fn,[(c(!0),f(V,null,ne(t.value,s=>(c(),f("li",{key:s.id},[i("span",bn,h(s.name),1),H(" — "+h(s.currentStock)+" / "+h(s.reorderLevel)+" ",1),i("span",vn,"("+h(s.unit)+")",1)]))),128))])])]),_:1})])):x("",!0)}}),hn={class:"flex flex-col gap-4"},kn={class:"flex items-center justify-between"},wn={class:"flex items-center gap-2"},Sn={class:"flex items-center gap-3"},jn={key:1,class:"space-y-3"},xn={key:0,class:"text-gray-700"},Cn={key:1,class:"text-gray-400"},$n={class:"font-medium"},Ln={class:"text-gray-500 text-xs ml-1"},Pn={class:"flex gap-1"},Tn=q({__name:"InventoryList",setup(e){ve();const n=fe(),t=U(""),d=U(),m=U(!1),s=U(null),l=["kg","g","L","mL","pcs"],u=K(()=>({search:t.value||void 0,unit:d.value||void 0})),{data:b,isLoading:j}=Ce(u.value?{search:u.value.search,unit:u.value.unit}:void 0),R=$e();function T(v){return v.currentStock<=0?"Critical":v.currentStock<=v.reorderLevel?"Low":"Ok"}function N(v){return v.currentStock<=0?"danger":v.currentStock<=v.reorderLevel?"warn":"success"}function k(){s.value=null,m.value=!0}function o(v){s.value=v,m.value=!0}function p(){m.value=!1,s.value=null}function B(v){n.require({message:`Delete "${v.name}"? This action cannot be undone.`,header:"Confirm Delete",icon:"pi pi-exclamation-triangle",rejectLabel:"Cancel",acceptLabel:"Delete",acceptClass:"p-button-danger",accept:()=>R.mutate(v.id)})}return(v,S)=>{var I;return c(),f("div",hn,[i("div",kn,[S[3]||(S[3]=i("h1",{class:"text-2xl font-bold text-gray-900"},"Inventory",-1)),i("div",wn,[a(r(z),{label:"Stock Adjustment",severity:"secondary",icon:"pi pi-refresh",onClick:S[0]||(S[0]=g=>v.$router.push("/inventory/adjust"))}),a(r(z),{label:"Add Ingredient",icon:"pi pi-plus",onClick:k})])]),r(b)?(c(),L(yn,{key:0,ingredients:r(b)},null,8,["ingredients"])):x("",!0),i("div",Sn,[a(r(he),{iconPosition:"left",class:"flex-1"},{default:y(()=>[a(r(ke),{class:"pi pi-search"}),a(r(E),{modelValue:t.value,"onUpdate:modelValue":S[1]||(S[1]=g=>t.value=g),placeholder:"Search ingredients...",class:"w-full"},null,8,["modelValue"])]),_:1}),a(r(te),{modelValue:d.value,"onUpdate:modelValue":S[2]||(S[2]=g=>d.value=g),options:l,placeholder:"All Units",class:"w-40",showClear:!0},null,8,["modelValue"])]),r(j)&&!((I=r(b))!=null&&I.length)?(c(),f("div",jn,[(c(),f(V,null,ne(5,g=>i("div",{key:g,class:"flex gap-4"},[...S[4]||(S[4]=[be('<div class="skeleton-text flex-1 h-8"></div><div class="skeleton-text w-24 h-8"></div><div class="skeleton-text w-20 h-8"></div><div class="skeleton-text w-24 h-8"></div><div class="skeleton-text w-20 h-8"></div><div class="skeleton-text w-16 h-8"></div>',6)])])),64))])):(c(),f(V,{key:2},[a(r(ye),{value:r(b)??[],loading:r(j),paginator:!0,rows:10,rowsPerPageOptions:[10,25,50],stripedRows:"",sortField:"name",sortOrder:1,class:"p-datatable-sm"},{default:y(()=>[a(r(C),{field:"name",header:"Name",sortable:""}),a(r(C),{field:"category",header:"Category",sortable:""},{body:y(({data:g})=>[g.category?(c(),f("span",xn,h(g.category),1)):(c(),f("span",Cn,"—"))]),_:1}),a(r(C),{field:"unit",header:"Unit",sortable:""}),a(r(C),{field:"currentStock",header:"Current Stock",sortable:""},{body:y(({data:g})=>[i("span",$n,h(g.currentStock),1),i("span",Ln,h(g.unit),1)]),_:1}),a(r(C),{field:"reorderLevel",header:"Reorder Level",sortable:""},{body:y(({data:g})=>[H(h(g.reorderLevel),1)]),_:1}),a(r(C),{field:"unitCost",header:"Unit Cost",sortable:""},{body:y(({data:g})=>[H(h(r(Se)(g.unitCost)),1)]),_:1}),a(r(C),{header:"Status"},{body:y(({data:g})=>[a(r(we),{value:T(g),severity:N(g)},null,8,["value","severity"])]),_:1}),a(r(C),{header:"Actions",style:{width:"8rem"}},{body:y(({data:g})=>[i("div",Pn,[a(r(z),{icon:"pi pi-pencil",severity:"secondary",text:"",rounded:"",onClick:ie=>o(g)},null,8,["onClick"]),a(r(z),{icon:"pi pi-trash",severity:"danger",text:"",rounded:"",onClick:ie=>B(g)},null,8,["onClick"])])]),_:1})]),_:1},8,["value","loading"]),a(Ge,{visible:m.value,ingredient:s.value,onClose:p,onSaved:p},null,8,["visible","ingredient"]),a(r(oe))],64))])}}});export{Tn as default};
