import{B as R,l as A,m as V,a as x,c as b,d as C,b as i,j as c,u as d,k as S,F as T,p as z,t as m,e as k,g as f,f as w,J as q}from"./index-BZddHLoJ.js";import{d as B,s as y}from"./index-DGvFVRA8.js";import{s as F}from"./index-nmmT-I7r.js";import{s as N}from"./index-dpcNj_vg.js";import{p as H}from"./validators-DKfC8ku1.js";import{b as U,d as E}from"./useInventory-CcZo_uS3.js";import"./useSnackbar-V9QKU82e.js";var D=`
    .p-textarea {
        font-family: inherit;
        font-feature-settings: inherit;
        font-size: 1rem;
        color: dt('textarea.color');
        background: dt('textarea.background');
        padding-block: dt('textarea.padding.y');
        padding-inline: dt('textarea.padding.x');
        border: 1px solid dt('textarea.border.color');
        transition:
            background dt('textarea.transition.duration'),
            color dt('textarea.transition.duration'),
            border-color dt('textarea.transition.duration'),
            outline-color dt('textarea.transition.duration'),
            box-shadow dt('textarea.transition.duration');
        appearance: none;
        border-radius: dt('textarea.border.radius');
        outline-color: transparent;
        box-shadow: dt('textarea.shadow');
    }

    .p-textarea:enabled:hover {
        border-color: dt('textarea.hover.border.color');
    }

    .p-textarea:enabled:focus {
        border-color: dt('textarea.focus.border.color');
        box-shadow: dt('textarea.focus.ring.shadow');
        outline: dt('textarea.focus.ring.width') dt('textarea.focus.ring.style') dt('textarea.focus.ring.color');
        outline-offset: dt('textarea.focus.ring.offset');
    }

    .p-textarea.p-invalid {
        border-color: dt('textarea.invalid.border.color');
    }

    .p-textarea.p-variant-filled {
        background: dt('textarea.filled.background');
    }

    .p-textarea.p-variant-filled:enabled:hover {
        background: dt('textarea.filled.hover.background');
    }

    .p-textarea.p-variant-filled:enabled:focus {
        background: dt('textarea.filled.focus.background');
    }

    .p-textarea:disabled {
        opacity: 1;
        background: dt('textarea.disabled.background');
        color: dt('textarea.disabled.color');
    }

    .p-textarea::placeholder {
        color: dt('textarea.placeholder.color');
    }

    .p-textarea.p-invalid::placeholder {
        color: dt('textarea.invalid.placeholder.color');
    }

    .p-textarea-fluid {
        width: 100%;
    }

    .p-textarea-resizable {
        overflow: hidden;
        resize: none;
    }

    .p-textarea-sm {
        font-size: dt('textarea.sm.font.size');
        padding-block: dt('textarea.sm.padding.y');
        padding-inline: dt('textarea.sm.padding.x');
    }

    .p-textarea-lg {
        font-size: dt('textarea.lg.font.size');
        padding-block: dt('textarea.lg.padding.y');
        padding-inline: dt('textarea.lg.padding.x');
    }
`,O={root:function(e){var r=e.instance,a=e.props;return["p-textarea p-component",{"p-filled":r.$filled,"p-textarea-resizable ":a.autoResize,"p-textarea-sm p-inputfield-sm":a.size==="small","p-textarea-lg p-inputfield-lg":a.size==="large","p-invalid":r.$invalid,"p-variant-filled":r.$variant==="filled","p-textarea-fluid":r.$fluid}]}},M=R.extend({name:"textarea",style:D,classes:O}),J={name:"BaseTextarea",extends:B,props:{autoResize:Boolean},style:M,provide:function(){return{$pcTextarea:this,$parentInstance:this}}};function g(t){"@babel/helpers - typeof";return g=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},g(t)}function K(t,e,r){return(e=L(e))in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}function L(t){var e=Q(t,"string");return g(e)=="symbol"?e:e+""}function Q(t,e){if(g(t)!="object"||!t)return t;var r=t[Symbol.toPrimitive];if(r!==void 0){var a=r.call(t,e);if(g(a)!="object")return a;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(t)}var P={name:"Textarea",extends:J,inheritAttrs:!1,observer:null,mounted:function(){var e=this;this.autoResize&&(this.observer=new ResizeObserver(function(){requestAnimationFrame(function(){e.resize()})}),this.observer.observe(this.$el))},updated:function(){this.autoResize&&this.resize()},beforeUnmount:function(){this.observer&&this.observer.disconnect()},methods:{resize:function(){if(this.$el.offsetParent){var e=this.$el.style.height,r=parseInt(e)||0,a=this.$el.scrollHeight,l=!r||a>r,o=r&&a<r;o?(this.$el.style.height="auto",this.$el.style.height="".concat(this.$el.scrollHeight,"px")):l&&(this.$el.style.height="".concat(a,"px"))}},onInput:function(e){this.autoResize&&this.resize(),this.writeValue(e.target.value,e)}},computed:{attrs:function(){return V(this.ptmi("root",{context:{filled:this.$filled,disabled:this.disabled}}),this.formField)},dataP:function(){return A(K({invalid:this.$invalid,fluid:this.$fluid,filled:this.$variant==="filled"},this.size,this.size))}}},G=["value","name","disabled","aria-invalid","data-p"];function W(t,e,r,a,l,o){return x(),b("textarea",V({class:t.cx("root"),value:t.d_value,name:t.name,disabled:t.disabled,"aria-invalid":t.invalid||void 0,"data-p":o.dataP,onInput:e[0]||(e[0]=function(){return o.onInput&&o.onInput.apply(o,arguments)})},o.attrs),null,16,G)}P.render=W;const X={class:"max-w-xl mx-auto flex flex-col gap-6"},Y={class:"flex items-center gap-3"},Z={class:"card bg-white rounded-lg border border-gray-200 p-6 flex flex-col gap-5"},ee={class:"field"},te={class:"bg-gray-50 rounded-lg p-4 flex items-center justify-between"},ne={class:"text-lg font-bold"},ae={class:"text-sm font-normal text-gray-500"},re={class:"field"},ie={class:"flex gap-2"},oe={class:"field"},le={key:0,class:"text-red-500"},se={class:"field"},de={key:0,class:"bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800"},ue={class:"text-orange-600"},ge=C({__name:"StockAdjustment",setup(t){q();const{data:e}=U(),r=E(),a=f(null),l=f("in"),o=f(0),v=f(""),p=f(null),h=f(!1),j=w(()=>r.isPending.value),$=w(()=>{const u=o.value||0;return l.value==="in"?u:-u}),I=w(()=>a.value?Math.max(0,+(a.value.currentStock+$.value).toFixed(3)):0);async function _(){if(p.value=null,h.value=!1,!a.value){h.value=!0;return}const u=H(o.value);if(u!==!0){p.value=u;return}if(!v.value.trim()){p.value="Reason is required";return}await r.mutateAsync({id:a.value.id,delta:$.value,reason:v.value}),a.value=null,o.value=0,v.value="",l.value="in"}return(u,n)=>(x(),b("div",X,[i("div",Y,[c(d(y),{icon:"pi pi-arrow-left",severity:"secondary",text:"",rounded:"",onClick:n[0]||(n[0]=s=>u.$router.push("/inventory"))}),n[6]||(n[6]=i("h1",{class:"text-2xl font-bold text-gray-900"},"Stock Adjustment",-1))]),i("div",Z,[i("div",ee,[n[7]||(n[7]=i("label",{for:"ingredient",class:"font-medium text-sm text-gray-700 mb-1 block"},"Ingredient",-1)),c(d(F),{id:"ingredient",modelValue:a.value,"onUpdate:modelValue":n[1]||(n[1]=s=>a.value=s),options:d(e)??[],optionLabel:"name",placeholder:"Select an ingredient",class:S(["w-full",{"p-invalid":h.value}])},null,8,["modelValue","options","class"])]),a.value?(x(),b(T,{key:0},[i("div",te,[n[8]||(n[8]=i("span",{class:"text-sm text-gray-600"},"Current Stock",-1)),i("span",ne,[z(m(a.value.currentStock)+" ",1),i("span",ae,m(a.value.unit),1)])]),i("div",re,[n[9]||(n[9]=i("label",{class:"font-medium text-sm text-gray-700 mb-2 block"},"Adjustment Type",-1)),i("div",ie,[c(d(y),{severity:l.value==="in"?"primary":"secondary",outlined:l.value!=="in",label:"Stock In",icon:"pi pi-plus-circle",onClick:n[2]||(n[2]=s=>l.value="in")},null,8,["severity","outlined"]),c(d(y),{severity:l.value==="out"?"danger":"secondary",outlined:l.value!=="out",label:"Stock Out",icon:"pi pi-minus-circle",onClick:n[3]||(n[3]=s=>l.value="out")},null,8,["severity","outlined"])])]),i("div",oe,[n[10]||(n[10]=i("label",{for:"quantity",class:"font-medium text-sm text-gray-700 mb-1 block"},"Quantity",-1)),c(d(N),{id:"quantity",modelValue:o.value,"onUpdate:modelValue":n[4]||(n[4]=s=>o.value=s),min:0,minFractionDigits:0,maxFractionDigits:3,class:S(["w-full",{"p-invalid":p.value}])},null,8,["modelValue","class"]),p.value?(x(),b("small",le,m(p.value),1)):k("",!0)]),i("div",se,[n[11]||(n[11]=i("label",{for:"reason",class:"font-medium text-sm text-gray-700 mb-1 block"},"Reason",-1)),c(d(P),{id:"reason",modelValue:v.value,"onUpdate:modelValue":n[5]||(n[5]=s=>v.value=s),rows:"2",placeholder:"e.g. Supplier delivery, spoilage, etc.",class:"w-full"},null,8,["modelValue"])]),o.value>0?(x(),b("div",de,[n[12]||(n[12]=z(" New stock will be: ",-1)),i("strong",null,m(I.value),1),i("span",ue,m(a.value.unit),1)])):k("",!0),c(d(y),{label:"Submit Adjustment",icon:"pi pi-check",class:"w-full",loading:j.value,onClick:_},null,8,["loading"])],64)):k("",!0)])]))}});export{ge as default};
