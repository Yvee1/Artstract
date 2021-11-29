using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class CreatePoints : MonoBehaviour
{
    public TextAsset imageAsset;
    Renderer rend;

    // Start is called before the first frame update
    void Start()
    {
        rend = GetComponent<Renderer>();
        Sprite circleSprite = Resources.Load<Sprite>("Circle");
        Debug.Log(circleSprite);
        Texture2D tex = new Texture2D(2, 2);
        tex.LoadImage(imageAsset.bytes);
        GetComponent<Renderer>().material.mainTexture = tex;
        Color[] pixels = tex.GetPixels();
        int step = 10;

        for (int x = 0; x < tex.width; x+=step){
            for (int y = 0; y < tex.height; y+=step){
                int index = x + y * tex.width;
                float xx = x/ ((float) tex.width) - 0.5f;
                float yy = y/ ((float) tex.height) - 0.5f;
                Vector2 posScale = rend.bounds.size;
                float radius = 0.04f;
                GameObject point = new GameObject();
                point.transform.position = new Vector3(posScale.x * xx, posScale.y * yy, 0f);
                point.transform.localScale = new Vector3(radius, radius, radius);

                SpriteRenderer renderer = point.AddComponent<SpriteRenderer>();
                renderer.color = pixels[index];
                renderer.sprite = circleSprite;

                // pixels[index];
            }
        }
    }

    // Update is called once per frame
    void Update()
    {
        
    }
}
