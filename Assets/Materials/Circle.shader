Shader "Unlit/Circle"
{
    Properties
    {
        _MainTex ("Texture", 2D) = "white" {}
        _Color("Color", Color) = (1.0, 1.0, 1.0, 1.0)
    }
    SubShader
    {
        Tags { "RenderType"="Transparent"  "Queue"="Transparent" }
        LOD 100

        Blend SrcAlpha OneMinusSrcAlpha
        ZWrite Off

        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            // make fog work
            #pragma multi_compile_fog

            #include "UnityCG.cginc"

            struct appdata
            {
                float4 vertex : POSITION;
                float2 uv : TEXCOORD0;
            };

            struct v2f
            {
                float2 uv : TEXCOORD0;
                UNITY_FOG_COORDS(1)
                float4 vertex : SV_POSITION;
            };

            sampler2D _MainTex;
            float4 _MainTex_ST;

            v2f vert (appdata v)
            {
                v2f o;
                o.vertex = UnityObjectToClipPos(v.vertex);
                o.uv = TRANSFORM_TEX(v.uv, _MainTex);
                UNITY_TRANSFER_FOG(o,o.vertex);
                return o;
            }

            float aastep(float threshold, float value){
                float halfChange = fwidth(value) / 2;
                float lowerEdge = threshold - halfChange;
                float upperEdge = threshold + halfChange;
                return smoothstep(lowerEdge, upperEdge, value);
            }

            uniform float4 _Color;

            float4 frag (v2f i) : SV_Target
            {
                float alpha = 1 - aastep(0.5, length(i.uv - float2(0.5, 0.5)));
                return float4(alpha, alpha, alpha, alpha);
            }
            ENDCG
        }
    }
}
