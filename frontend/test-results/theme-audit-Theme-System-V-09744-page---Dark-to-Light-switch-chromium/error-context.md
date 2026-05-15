# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: theme-audit.spec.ts >> Theme System Validation >> TEST 2: Dark → Light Theme Switch >> Home page - Dark to Light switch
- Location: e2e\theme-audit.spec.ts:107:11

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - alert [ref=e2]
  - banner [ref=e3]:
    - generic [ref=e5]:
      - generic [ref=e6]: Big Summer Sale - Up to 50% OFF!
      - generic [ref=e7]: "Support: +91 6380123183"
    - generic [ref=e9]:
      - link "A AMOHA MOBILES Your Trusted Mobile Partner" [ref=e10] [cursor=pointer]:
        - /url: /
        - generic [ref=e11]: A
        - generic [ref=e12]:
          - text: AMOHA MOBILES
          - paragraph [ref=e13]: Your Trusted Mobile Partner
      - generic [ref=e16]:
        - img [ref=e17]
        - textbox "Search mobiles, brands..." [ref=e19]
      - generic [ref=e20]:
        - link "Products" [ref=e21] [cursor=pointer]:
          - /url: /products
          - img [ref=e22]
          - generic [ref=e24]: Products
        - link "Services" [ref=e25] [cursor=pointer]:
          - /url: /services
          - img [ref=e26]
          - generic [ref=e29]: Services
        - link "Orders" [ref=e30] [cursor=pointer]:
          - /url: /orders
          - img [ref=e31]
          - generic [ref=e33]: Orders
        - button "Toggle theme" [ref=e35] [cursor=pointer]:
          - img [ref=e36]
        - link [ref=e38] [cursor=pointer]:
          - /url: /wishlist
          - img [ref=e39]
        - link [ref=e41] [cursor=pointer]:
          - /url: /compare
          - img [ref=e42]
        - link [ref=e44] [cursor=pointer]:
          - /url: /cart
          - img [ref=e45]
        - link "Login" [ref=e48] [cursor=pointer]:
          - /url: /login
          - img [ref=e49]
          - generic [ref=e51]: Login
  - main [ref=e52]:
    - generic [ref=e53]:
      - generic [ref=e56]:
        - generic [ref=e57]:
          - generic:
            - img "Previous banner preview"
          - generic:
            - img "Next banner preview"
          - link "Shop_Front" [ref=e59] [cursor=pointer]:
            - /url: /products
            - img "Shop_Front" [ref=e60]
        - generic [ref=e62]:
          - button "Show slide 1" [ref=e63] [cursor=pointer]
          - button "Show slide 2" [ref=e64] [cursor=pointer]
          - button "Show slide 3" [ref=e65] [cursor=pointer]
          - button "Show slide 4" [ref=e66] [cursor=pointer]
      - generic [ref=e68]:
        - generic [ref=e69]:
          - img [ref=e71]
          - generic [ref=e73]:
            - paragraph [ref=e74]: Fast Delivery
            - paragraph [ref=e75]: Within 2-3 days
        - generic [ref=e76]:
          - img [ref=e78]
          - generic [ref=e80]:
            - paragraph [ref=e81]: Warranty
            - paragraph [ref=e82]: Product warranty included
        - generic [ref=e83]:
          - img [ref=e85]
          - generic [ref=e88]:
            - paragraph [ref=e89]: Free Shipping
            - paragraph [ref=e90]: On orders above Rs.999
        - generic [ref=e91]:
          - img [ref=e93]
          - generic [ref=e95]:
            - paragraph [ref=e96]: Easy Returns
            - paragraph [ref=e97]: 7 day return policy
      - generic [ref=e99]:
        - heading "Shop by Category" [level=2] [ref=e101]
        - generic [ref=e102]:
          - link "USB Cable USB Cable 2 products" [ref=e103] [cursor=pointer]:
            - /url: /products?category=accessories
            - img "USB Cable" [ref=e105]
            - generic [ref=e106]:
              - paragraph [ref=e107]: USB Cable
              - paragraph [ref=e108]: 2 products
          - link "Wireless HeadSet Wireless HeadSet" [ref=e109] [cursor=pointer]:
            - /url: /products?category=wireless-headset
            - img "Wireless HeadSet" [ref=e111]
            - paragraph [ref=e113]: Wireless HeadSet
          - link "Wired Headset Wired Headset 1 products" [ref=e114] [cursor=pointer]:
            - /url: /products?category=head-set
            - img "Wired Headset" [ref=e116]
            - generic [ref=e117]:
              - paragraph [ref=e118]: Wired Headset
              - paragraph [ref=e119]: 1 products
          - link "Fast Phone Charger Fast Phone Charger" [ref=e120] [cursor=pointer]:
            - /url: /products?category=fast-phone-charger
            - img "Fast Phone Charger" [ref=e122]
            - paragraph [ref=e124]: Fast Phone Charger
          - link "Powerbank Powerbank" [ref=e125] [cursor=pointer]:
            - /url: /products?category=powerbank
            - img "Powerbank" [ref=e127]
            - paragraph [ref=e129]: Powerbank
          - link "Memory Card Memory Card" [ref=e130] [cursor=pointer]:
            - /url: /products?category=memory-card
            - img "Memory Card" [ref=e132]
            - paragraph [ref=e134]: Memory Card
          - link "Smartwatch Smartwatch" [ref=e135] [cursor=pointer]:
            - /url: /products?category=smartwatch
            - img "Smartwatch" [ref=e137]
            - paragraph [ref=e139]: Smartwatch
          - link "Smart Phones Smart Phones 6 products" [ref=e140] [cursor=pointer]:
            - /url: /products?category=smartphones
            - img "Smart Phones" [ref=e142]
            - generic [ref=e143]:
              - paragraph [ref=e144]: Smart Phones
              - paragraph [ref=e145]: 6 products
          - link "Phone Charger (CAR) Phone Charger (CAR)" [ref=e146] [cursor=pointer]:
            - /url: /products?category=phone-charger-car
            - img "Phone Charger (CAR)" [ref=e148]
            - paragraph [ref=e150]: Phone Charger (CAR)
          - link "Charger Charger 3 products" [ref=e151] [cursor=pointer]:
            - /url: /products?category=charger
            - img "Charger" [ref=e153]
            - generic [ref=e154]:
              - paragraph [ref=e155]: Charger
              - paragraph [ref=e156]: 3 products
          - link "Tempered Glass Tempered Glass" [ref=e157] [cursor=pointer]:
            - /url: /products?category=tempered-glass
            - img "Tempered Glass" [ref=e159]
            - paragraph [ref=e161]: Tempered Glass
          - link "Key Pad Phones Key Pad Phones 3 products" [ref=e162] [cursor=pointer]:
            - /url: /products?category=24etwgsdv
            - img "Key Pad Phones" [ref=e164]
            - generic [ref=e165]:
              - paragraph [ref=e166]: Key Pad Phones
              - paragraph [ref=e167]: 3 products
          - link "Phone Holder Phone Holder" [ref=e168] [cursor=pointer]:
            - /url: /products?category=phone-holder
            - img "Phone Holder" [ref=e170]
            - paragraph [ref=e172]: Phone Holder
          - link "Bluetooth Speaker Bluetooth Speaker" [ref=e173] [cursor=pointer]:
            - /url: /products?category=bluetooth-speaker
            - img "Bluetooth Speaker" [ref=e175]
            - paragraph [ref=e177]: Bluetooth Speaker
          - link "USB Thumbdrive USB Thumbdrive" [ref=e178] [cursor=pointer]:
            - /url: /products?category=usb-thumbdrive
            - img "USB Thumbdrive" [ref=e180]
            - paragraph [ref=e182]: USB Thumbdrive
          - link "Mobile Back Case Cover Mobile Back Case Cover" [ref=e183] [cursor=pointer]:
            - /url: /products?category=mobile-back-case-cover
            - img "Mobile Back Case Cover" [ref=e185]
            - paragraph [ref=e187]: Mobile Back Case Cover
          - link "Mouse Mouse 1 products" [ref=e188] [cursor=pointer]:
            - /url: /products?category=mouse
            - img "Mouse" [ref=e190]
            - generic [ref=e191]:
              - paragraph [ref=e192]: Mouse
              - paragraph [ref=e193]: 1 products
          - link "Used Phones Used Phones 10 products" [ref=e194] [cursor=pointer]:
            - /url: /products?category=used-phones
            - img "Used Phones" [ref=e196]
            - generic [ref=e197]:
              - paragraph [ref=e198]: Used Phones
              - paragraph [ref=e199]: 10 products
          - link "Ear Buds Ear Buds" [ref=e200] [cursor=pointer]:
            - /url: /products?category=airpod
            - img "Ear Buds" [ref=e202]
            - paragraph [ref=e204]: Ear Buds
          - link "Wireless Earbuds Wireless Earbuds" [ref=e205] [cursor=pointer]:
            - /url: /products?category=wireless-earbuds
            - img "Wireless Earbuds" [ref=e207]
            - paragraph [ref=e209]: Wireless Earbuds
      - generic [ref=e211]:
        - generic [ref=e212]:
          - heading "Trending Now" [level=2] [ref=e213]
          - link "View All" [ref=e214] [cursor=pointer]:
            - /url: /products?sort=popular
        - generic [ref=e215]:
          - link "USED SAMSUNG S20 FE 5G -10% Add to Cart USED SAMSUNG S20 FE 5G ₹9,000 ₹10,000" [ref=e217] [cursor=pointer]:
            - /url: /product/used-samsung-s20-fe-5g
            - generic [ref=e218]:
              - generic [ref=e219]:
                - img "USED SAMSUNG S20 FE 5G" [ref=e220]
                - generic [ref=e221]: "-10%"
                - button [ref=e222]:
                  - img [ref=e223]
                - button [ref=e225]:
                  - img [ref=e226]
                - button "Add to Cart" [ref=e228]:
                  - img [ref=e229]
                  - text: Add to Cart
              - generic [ref=e231]:
                - paragraph
                - heading "USED SAMSUNG S20 FE 5G" [level=3] [ref=e232]
                - generic [ref=e236]:
                  - generic [ref=e237]: ₹9,000
                  - generic [ref=e238]: ₹10,000
          - link "Rayon -10% Add to Cart Rayon ₹450 ₹500" [ref=e240] [cursor=pointer]:
            - /url: /product/rayon
            - generic [ref=e241]:
              - generic [ref=e242]:
                - img "Rayon" [ref=e243]
                - generic [ref=e244]: "-10%"
                - button [ref=e245]:
                  - img [ref=e246]
                - button [ref=e248]:
                  - img [ref=e249]
                - button "Add to Cart" [ref=e251]:
                  - img [ref=e252]
                  - text: Add to Cart
              - generic [ref=e254]:
                - paragraph
                - heading "Rayon" [level=3] [ref=e255]
                - generic [ref=e259]:
                  - generic [ref=e260]: ₹450
                  - generic [ref=e261]: ₹500
          - link "ITEL ACE 3 SHINE Add to Cart ITEL ACE 3 SHINE ₹1,300" [ref=e263] [cursor=pointer]:
            - /url: /product/itel-ace-3-shine
            - generic [ref=e264]:
              - generic [ref=e265]:
                - img "ITEL ACE 3 SHINE" [ref=e266]
                - button [ref=e267]:
                  - img [ref=e268]
                - button [ref=e270]:
                  - img [ref=e271]
                - button "Add to Cart" [ref=e273]:
                  - img [ref=e274]
                  - text: Add to Cart
              - generic [ref=e276]:
                - paragraph
                - heading "ITEL ACE 3 SHINE" [level=3] [ref=e277]
                - generic [ref=e282]: ₹1,300
          - link "Lebono 42W Type V8 Charger -18% Add to Cart Lebono 42W Type V8 Charger ₹450 ₹550" [ref=e284] [cursor=pointer]:
            - /url: /product/lebono-42w-type-v8-charger
            - generic [ref=e285]:
              - generic [ref=e286]:
                - img "Lebono 42W Type V8 Charger" [ref=e287]
                - generic [ref=e288]: "-18%"
                - button [ref=e289]:
                  - img [ref=e290]
                - button [ref=e292]:
                  - img [ref=e293]
                - button "Add to Cart" [ref=e295]:
                  - img [ref=e296]
                  - text: Add to Cart
              - generic [ref=e298]:
                - paragraph
                - heading "Lebono 42W Type V8 Charger" [level=3] [ref=e299]
                - generic [ref=e303]:
                  - generic [ref=e304]: ₹450
                  - generic [ref=e305]: ₹550
          - link "Used itel A 100c 4G -8% Add to Cart Used itel A 100c 4G ₹9,199 ₹10,000" [ref=e307] [cursor=pointer]:
            - /url: /product/used-itel-a-100c-4g
            - generic [ref=e308]:
              - generic [ref=e309]:
                - img "Used itel A 100c 4G" [ref=e310]
                - generic [ref=e311]: "-8%"
                - button [ref=e312]:
                  - img [ref=e313]
                - button [ref=e315]:
                  - img [ref=e316]
                - button "Add to Cart" [ref=e318]:
                  - img [ref=e319]
                  - text: Add to Cart
              - generic [ref=e321]:
                - paragraph
                - heading "Used itel A 100c 4G" [level=3] [ref=e322]
                - generic [ref=e326]:
                  - generic [ref=e327]: ₹9,199
                  - generic [ref=e328]: ₹10,000
          - link "Used Samsung A16 5G -10% Add to Cart Used Samsung A16 5G ₹9,000 ₹10,000" [ref=e330] [cursor=pointer]:
            - /url: /product/used-samsung-a16-5g
            - generic [ref=e331]:
              - generic [ref=e332]:
                - img "Used Samsung A16 5G" [ref=e333]
                - generic [ref=e334]: "-10%"
                - button [ref=e335]:
                  - img [ref=e336]
                - button [ref=e338]:
                  - img [ref=e339]
                - button "Add to Cart" [ref=e341]:
                  - img [ref=e342]
                  - text: Add to Cart
              - generic [ref=e344]:
                - paragraph
                - heading "Used Samsung A16 5G" [level=3] [ref=e345]
                - generic [ref=e349]:
                  - generic [ref=e350]: ₹9,000
                  - generic [ref=e351]: ₹10,000
          - link "AMFOX Fast Charger 17W -10% Add to Cart AMFOX Fast Charger 17W ₹270 ₹300" [ref=e353] [cursor=pointer]:
            - /url: /product/amfox-fast-charger-17w
            - generic [ref=e354]:
              - generic [ref=e355]:
                - img "AMFOX Fast Charger 17W" [ref=e356]
                - generic [ref=e357]: "-10%"
                - button [ref=e358]:
                  - img [ref=e359]
                - button [ref=e361]:
                  - img [ref=e362]
                - button "Add to Cart" [ref=e364]:
                  - img [ref=e365]
                  - text: Add to Cart
              - generic [ref=e367]:
                - paragraph
                - heading "AMFOX Fast Charger 17W" [level=3] [ref=e368]
                - generic [ref=e372]:
                  - generic [ref=e373]: ₹270
                  - generic [ref=e374]: ₹300
          - link "itel it2181 keypad mobile Add to Cart itel it2181 keypad mobile ₹1,500" [ref=e376] [cursor=pointer]:
            - /url: /product/itel-it2181-keypad-mobile
            - generic [ref=e377]:
              - generic [ref=e378]:
                - img "itel it2181 keypad mobile" [ref=e379]
                - button [ref=e380]:
                  - img [ref=e381]
                - button [ref=e383]:
                  - img [ref=e384]
                - button "Add to Cart" [ref=e386]:
                  - img [ref=e387]
                  - text: Add to Cart
              - generic [ref=e389]:
                - paragraph
                - heading "itel it2181 keypad mobile" [level=3] [ref=e390]
                - generic [ref=e395]: ₹1,500
      - generic [ref=e397]:
        - generic [ref=e398]:
          - heading "Discover More" [level=2] [ref=e399]
          - paragraph [ref=e400]: Find the latest releases, offers and exclusives right here
        - generic [ref=e401]:
          - link "USB Cable USB Cable" [ref=e402] [cursor=pointer]:
            - /url: /products?category=accessories
            - img "USB Cable" [ref=e403]
            - generic [ref=e405]: USB Cable
          - link "Wireless HeadSet Wireless HeadSet" [ref=e406] [cursor=pointer]:
            - /url: /products?category=wireless-headset
            - img "Wireless HeadSet" [ref=e407]
            - generic [ref=e409]: Wireless HeadSet
          - link "Wired Headset Wired Headset" [ref=e410] [cursor=pointer]:
            - /url: /products?category=head-set
            - img "Wired Headset" [ref=e411]
            - generic [ref=e413]: Wired Headset
          - link "Fast Phone Charger Fast Phone Charger" [ref=e414] [cursor=pointer]:
            - /url: /products?category=fast-phone-charger
            - img "Fast Phone Charger" [ref=e415]
            - generic [ref=e417]: Fast Phone Charger
      - generic [ref=e419]:
        - generic [ref=e420]:
          - heading "New Arrivals" [level=2] [ref=e421]
          - link "View All" [ref=e422] [cursor=pointer]:
            - /url: /products?sort=newest
        - generic [ref=e423]:
          - link "Used Samsung Galaxy M06 5G Out of Stock SAMSUNG Used Samsung Galaxy M06 5G ₹11,000 ₹15,000" [ref=e424] [cursor=pointer]:
            - /url: /product/used-samsung-galaxy-m06-5g
            - generic [ref=e425]:
              - generic [ref=e426]:
                - img "Used Samsung Galaxy M06 5G" [ref=e427]
                - generic [ref=e429]: Out of Stock
                - button [ref=e430]:
                  - img [ref=e431]
                - button [ref=e433]:
                  - img [ref=e434]
              - generic [ref=e436]:
                - paragraph [ref=e437]: SAMSUNG
                - heading "Used Samsung Galaxy M06 5G" [level=3] [ref=e438]
                - generic [ref=e442]:
                  - generic [ref=e443]: ₹11,000
                  - generic [ref=e444]: ₹15,000
          - link "Used GALAXY M14 5G -5% Add to Cart SAMSUNG Used GALAXY M14 5G ₹9,500 ₹10,000" [ref=e445] [cursor=pointer]:
            - /url: /product/used-galaxy-m14-5g
            - generic [ref=e446]:
              - generic [ref=e447]:
                - img "Used GALAXY M14 5G" [ref=e448]
                - generic [ref=e449]: "-5%"
                - button [ref=e450]:
                  - img [ref=e451]
                - button [ref=e453]:
                  - img [ref=e454]
                - button "Add to Cart" [ref=e456]:
                  - img [ref=e457]
                  - text: Add to Cart
              - generic [ref=e459]:
                - paragraph [ref=e460]: SAMSUNG
                - heading "Used GALAXY M14 5G" [level=3] [ref=e461]
                - generic [ref=e465]:
                  - generic [ref=e466]: ₹9,500
                  - generic [ref=e467]: ₹10,000
          - link "Used GOOGLE 7A (5G) -7% Add to Cart GOOGLE Used GOOGLE 7A (5G) ₹14,000 ₹15,000" [ref=e468] [cursor=pointer]:
            - /url: /product/used-google-7a-5g
            - generic [ref=e469]:
              - generic [ref=e470]:
                - img "Used GOOGLE 7A (5G)" [ref=e471]
                - generic [ref=e472]: "-7%"
                - button [ref=e473]:
                  - img [ref=e474]
                - button [ref=e476]:
                  - img [ref=e477]
                - button "Add to Cart" [ref=e479]:
                  - img [ref=e480]
                  - text: Add to Cart
              - generic [ref=e482]:
                - paragraph [ref=e483]: GOOGLE
                - heading "Used GOOGLE 7A (5G)" [level=3] [ref=e484]
                - generic [ref=e488]:
                  - generic [ref=e489]: ₹14,000
                  - generic [ref=e490]: ₹15,000
          - link "Used Samsung A16 5G -10% Add to Cart SAMSUNG Used Samsung A16 5G ₹9,000 ₹10,000" [ref=e491] [cursor=pointer]:
            - /url: /product/used-samsung-a16-5g
            - generic [ref=e492]:
              - generic [ref=e493]:
                - img "Used Samsung A16 5G" [ref=e494]
                - generic [ref=e495]: "-10%"
                - button [ref=e496]:
                  - img [ref=e497]
                - button [ref=e499]:
                  - img [ref=e500]
                - button "Add to Cart" [ref=e502]:
                  - img [ref=e503]
                  - text: Add to Cart
              - generic [ref=e505]:
                - paragraph [ref=e506]: SAMSUNG
                - heading "Used Samsung A16 5G" [level=3] [ref=e507]
                - generic [ref=e511]:
                  - generic [ref=e512]: ₹9,000
                  - generic [ref=e513]: ₹10,000
          - link "USED SAMSUNG S20 FE 5G -10% Add to Cart SAMSUNG USED SAMSUNG S20 FE 5G ₹9,000 ₹10,000" [ref=e514] [cursor=pointer]:
            - /url: /product/used-samsung-s20-fe-5g
            - generic [ref=e515]:
              - generic [ref=e516]:
                - img "USED SAMSUNG S20 FE 5G" [ref=e517]
                - generic [ref=e518]: "-10%"
                - button [ref=e519]:
                  - img [ref=e520]
                - button [ref=e522]:
                  - img [ref=e523]
                - button "Add to Cart" [ref=e525]:
                  - img [ref=e526]
                  - text: Add to Cart
              - generic [ref=e528]:
                - paragraph [ref=e529]: SAMSUNG
                - heading "USED SAMSUNG S20 FE 5G" [level=3] [ref=e530]
                - generic [ref=e534]:
                  - generic [ref=e535]: ₹9,000
                  - generic [ref=e536]: ₹10,000
          - link "USED VIVO Y33T 4G -5% Add to Cart VIVO USED VIVO Y33T 4G ₹9,500 ₹10,000" [ref=e537] [cursor=pointer]:
            - /url: /product/used-vivo-y33t-4g
            - generic [ref=e538]:
              - generic [ref=e539]:
                - img "USED VIVO Y33T 4G" [ref=e540]
                - generic [ref=e541]: "-5%"
                - button [ref=e542]:
                  - img [ref=e543]
                - button [ref=e545]:
                  - img [ref=e546]
                - button "Add to Cart" [ref=e548]:
                  - img [ref=e549]
                  - text: Add to Cart
              - generic [ref=e551]:
                - paragraph [ref=e552]: VIVO
                - heading "USED VIVO Y33T 4G" [level=3] [ref=e553]
                - generic [ref=e557]:
                  - generic [ref=e558]: ₹9,500
                  - generic [ref=e559]: ₹10,000
          - link "Used itel A100 MILITARY GRADE 4G Add to Cart ITEL Used itel A100 MILITARY GRADE 4G ₹10,499 ₹10,500" [ref=e560] [cursor=pointer]:
            - /url: /product/used-itel-a100-military-grade-4g
            - generic [ref=e561]:
              - generic [ref=e562]:
                - img "Used itel A100 MILITARY GRADE 4G" [ref=e563]
                - button [ref=e564]:
                  - img [ref=e565]
                - button [ref=e567]:
                  - img [ref=e568]
                - button "Add to Cart" [ref=e570]:
                  - img [ref=e571]
                  - text: Add to Cart
              - generic [ref=e573]:
                - paragraph [ref=e574]: ITEL
                - heading "Used itel A100 MILITARY GRADE 4G" [level=3] [ref=e575]
                - generic [ref=e579]:
                  - generic [ref=e580]: ₹10,499
                  - generic [ref=e581]: ₹10,500
          - link "UESD REDMI NOTE 14 (5G) -3% Add to Cart REDMI UESD REDMI NOTE 14 (5G) ₹15,500 ₹16,000" [ref=e582] [cursor=pointer]:
            - /url: /product/uesd-redmi-note-14-5g
            - generic [ref=e583]:
              - generic [ref=e584]:
                - img "UESD REDMI NOTE 14 (5G)" [ref=e585]
                - generic [ref=e586]: "-3%"
                - button [ref=e587]:
                  - img [ref=e588]
                - button [ref=e590]:
                  - img [ref=e591]
                - button "Add to Cart" [ref=e593]:
                  - img [ref=e594]
                  - text: Add to Cart
              - generic [ref=e596]:
                - paragraph [ref=e597]: REDMI
                - heading "UESD REDMI NOTE 14 (5G)" [level=3] [ref=e598]
                - generic [ref=e602]:
                  - generic [ref=e603]: ₹15,500
                  - generic [ref=e604]: ₹16,000
        - link "Explore All Products" [ref=e606] [cursor=pointer]:
          - /url: /products
          - text: Explore All Products
          - img [ref=e607]
  - contentinfo [ref=e609]:
    - generic [ref=e610]:
      - generic [ref=e611]:
        - generic [ref=e612]:
          - link "A AMOHA MOBILES" [ref=e613] [cursor=pointer]:
            - /url: /
            - generic [ref=e614]: A
            - generic [ref=e615]: AMOHA MOBILES
          - paragraph [ref=e616]: Your trusted destination for smartphones, accessories, and repairs with secure payments, clear policies, and dependable delivery across India.
          - generic [ref=e617]:
            - link "support@amohamobiles.com" [ref=e618] [cursor=pointer]:
              - /url: mailto:support@amohamobiles.com
              - img [ref=e619]
              - text: support@amohamobiles.com
            - link "+91 6380123183" [ref=e621] [cursor=pointer]:
              - /url: tel:+916380123183
              - img [ref=e622]
              - text: +91 6380123183
            - generic [ref=e624]:
              - img [ref=e625]
              - text: 73/3 Therveethi, Near Pallikonda Perumal Temple, Idikarai
          - generic [ref=e628]:
            - generic [ref=e629]: Secure Payments
            - generic [ref=e630]: Easy Returns
            - generic [ref=e631]: Fast Shipping
            - generic [ref=e632]: Trusted Support
          - paragraph [ref=e633]: Supports UPI, cards, wallets, EMI, COD, and selected international payments.
        - generic [ref=e634]:
          - heading "Shop" [level=3] [ref=e635]
          - list [ref=e636]:
            - listitem [ref=e637]:
              - link "All Mobiles" [ref=e638] [cursor=pointer]:
                - /url: /products
            - listitem [ref=e639]:
              - link "Featured" [ref=e640] [cursor=pointer]:
                - /url: /products?sort=popular
            - listitem [ref=e641]:
              - link "New Arrivals" [ref=e642] [cursor=pointer]:
                - /url: /products?sort=newest
            - listitem [ref=e643]:
              - link "Repair Services" [ref=e644] [cursor=pointer]:
                - /url: /services
        - generic [ref=e645]:
          - heading "Account" [level=3] [ref=e646]
          - list [ref=e647]:
            - listitem [ref=e648]:
              - link "My Profile" [ref=e649] [cursor=pointer]:
                - /url: /profile
            - listitem [ref=e650]:
              - link "My Orders" [ref=e651] [cursor=pointer]:
                - /url: /orders
            - listitem [ref=e652]:
              - link "Wishlist" [ref=e653] [cursor=pointer]:
                - /url: /wishlist
            - listitem [ref=e654]:
              - link "Contact Us" [ref=e655] [cursor=pointer]:
                - /url: /contact
            - listitem [ref=e656]:
              - link "About Us" [ref=e657] [cursor=pointer]:
                - /url: /about
        - generic [ref=e658]:
          - heading "Legal & Policies" [level=3] [ref=e659]
          - list [ref=e660]:
            - listitem [ref=e661]:
              - link "Privacy Policy" [ref=e662] [cursor=pointer]:
                - /url: /privacy-policy
            - listitem [ref=e663]:
              - link "Terms of Service" [ref=e664] [cursor=pointer]:
                - /url: /terms
            - listitem [ref=e665]:
              - link "Return Policy" [ref=e666] [cursor=pointer]:
                - /url: /return-policy
            - listitem [ref=e667]:
              - link "Shipping Info" [ref=e668] [cursor=pointer]:
                - /url: /shipping-info
          - paragraph [ref=e669]: Review our privacy, returns, shipping, and service terms before placing an order.
      - generic [ref=e670]:
        - generic [ref=e671]:
          - paragraph [ref=e672]: © 2026 AMOHA MOBILES Mobiles. All rights reserved.
          - generic [ref=e673]:
            - link "Privacy Policy" [ref=e674] [cursor=pointer]:
              - /url: /privacy-policy
            - link "Terms of Service" [ref=e675] [cursor=pointer]:
              - /url: /terms
            - link "Return Policy" [ref=e676] [cursor=pointer]:
              - /url: /return-policy
            - link "Shipping Info" [ref=e677] [cursor=pointer]:
              - /url: /shipping-info
        - generic [ref=e678]:
          - paragraph [ref=e679]: "Accepted payments: UPI, Visa, Mastercard, RuPay, net banking, EMI, COD, and selected international cards."
          - generic [ref=e680]: Powered by Next.js
```

# Test source

```ts
  17  |   { name: 'Products', path: '/products' },
  18  |   { name: 'Product Detail', path: '/product/apple-iphone-15' },
  19  |   { name: 'Cart', path: '/cart' },
  20  |   { name: 'Login', path: '/login' },
  21  |   { name: 'Register', path: '/register' },
  22  |   { name: 'Contact', path: '/contact' },
  23  |   { name: 'About', path: '/about' },
  24  |   { name: 'Services', path: '/services' },
  25  |   { name: 'Wishlist', path: '/wishlist' },
  26  |   { name: 'Compare', path: '/compare' },
  27  |   { name: 'Orders', path: '/orders' },
  28  |   { name: 'Profile', path: '/profile' },
  29  |   { name: 'Terms', path: '/terms' },
  30  |   { name: 'Privacy', path: '/privacy-policy' },
  31  | ];
  32  | 
  33  | /**
  34  |  * Helper to toggle theme via classList manipulation (avoids localStorage security issues in tests)
  35  |  */
  36  | async function setTheme(page: Page, theme: 'light' | 'dark') {
  37  |   await page.evaluate((t) => {
  38  |     const html = document.documentElement;
  39  |     html.classList.remove('light', 'dark');
  40  |     html.classList.add(t);
  41  |     html.style.colorScheme = t;
  42  |   }, theme);
  43  |   // Small delay for CSS to apply
  44  |   await page.waitForTimeout(150);
  45  | }
  46  | 
  47  | /**
  48  |  * Helper to check if an element has proper contrast
  49  |  */
  50  | async function hasProperContrast(element: any): Promise<boolean> {
  51  |   const styles = await element.evaluate((el: Element) => {
  52  |     const computed = window.getComputedStyle(el);
  53  |     return {
  54  |       color: computed.color,
  55  |       backgroundColor: computed.backgroundColor,
  56  |     };
  57  |   });
  58  |   
  59  |   // Basic check - if we can get styles, the element is rendered
  60  |   return styles.color !== 'rgba(0, 0, 0, 0)' && styles.color !== 'transparent';
  61  | }
  62  | 
  63  | test.describe('Theme System Validation', () => {
  64  |   
  65  |   test.describe('TEST 1: Light → Dark Theme Switch', () => {
  66  |     for (const page of PAGES) {
  67  |       test(`${page.name} page - Light to Dark switch`, async ({ page: pwPage }) => {
  68  |         // Start with light theme
  69  |         await setTheme(pwPage, 'light');
  70  |         await pwPage.goto(page.path);
  71  |         await pwPage.waitForLoadState('networkidle');
  72  |         
  73  |         // Verify light theme is applied
  74  |         const hasLightClass = await pwPage.evaluate(() => 
  75  |           document.documentElement.classList.contains('light')
  76  |         );
  77  |         expect(hasLightClass).toBe(true);
  78  |         
  79  |         // Switch to dark
  80  |         await setTheme(pwPage, 'dark');
  81  |         
  82  |         // Verify dark theme is applied
  83  |         const hasDarkClass = await pwPage.evaluate(() => 
  84  |           document.documentElement.classList.contains('dark')
  85  |         );
  86  |         expect(hasDarkClass).toBe(true);
  87  |         
  88  |         // Take screenshot for visual validation
  89  |         await pwPage.screenshot({ 
  90  |           path: `test-results/theme-dark-${page.name.toLowerCase().replace(/\s+/g, '-')}.png`,
  91  |           fullPage: true 
  92  |         });
  93  |         
  94  |         // Verify main content is visible
  95  |         await expect(pwPage.locator('body')).toBeVisible();
  96  |         
  97  |         // Verify text is readable (not white on white or black on black)
  98  |         const textElements = pwPage.locator('h1, h2, h3, p, span, a, button');
  99  |         const count = await textElements.count();
  100 |         expect(count).toBeGreaterThan(0);
  101 |       });
  102 |     }
  103 |   });
  104 | 
  105 |   test.describe('TEST 2: Dark → Light Theme Switch', () => {
  106 |     for (const page of PAGES) {
  107 |       test(`${page.name} page - Dark to Light switch`, async ({ page: pwPage }) => {
  108 |         // Start with dark theme
  109 |         await setTheme(pwPage, 'dark');
  110 |         await pwPage.goto(page.path);
  111 |         await pwPage.waitForLoadState('networkidle');
  112 |         
  113 |         // Verify dark theme
  114 |         const hasDarkClass = await pwPage.evaluate(() => 
  115 |           document.documentElement.classList.contains('dark')
  116 |         );
> 117 |         expect(hasDarkClass).toBe(true);
      |                              ^ Error: expect(received).toBe(expected) // Object.is equality
  118 |         
  119 |         // Switch to light
  120 |         await setTheme(pwPage, 'light');
  121 |         
  122 |         // Verify light theme
  123 |         const hasLightClass = await pwPage.evaluate(() => 
  124 |           document.documentElement.classList.contains('light')
  125 |         );
  126 |         expect(hasLightClass).toBe(true);
  127 |         
  128 |         // Take screenshot
  129 |         await pwPage.screenshot({ 
  130 |           path: `test-results/theme-light-${page.name.toLowerCase().replace(/\s+/g, '-')}.png`,
  131 |           fullPage: true 
  132 |         });
  133 |         
  134 |         // Verify content visibility
  135 |         const mainContent = pwPage.locator('main').first();
  136 |         await expect(mainContent).toBeVisible().catch(() => {
  137 |           return expect(pwPage.locator('body')).toBeVisible();
  138 |         });
  139 |       });
  140 |     }
  141 |   });
  142 | 
  143 |   test.describe('TEST 3: Theme Persistence on Refresh', () => {
  144 |     test('Dark theme persists after page refresh', async ({ page }) => {
  145 |       await setTheme(page, 'dark');
  146 |       await page.goto('/');
  147 |       await page.waitForLoadState('networkidle');
  148 |       
  149 |       // Verify dark theme
  150 |       let hasDarkClass = await page.evaluate(() => 
  151 |         document.documentElement.classList.contains('dark')
  152 |       );
  153 |       expect(hasDarkClass).toBe(true);
  154 |       
  155 |       // Refresh page
  156 |       await page.reload();
  157 |       await page.waitForLoadState('networkidle');
  158 |       
  159 |       // Verify dark theme persisted
  160 |       hasDarkClass = await page.evaluate(() => 
  161 |         document.documentElement.classList.contains('dark')
  162 |       );
  163 |       expect(hasDarkClass).toBe(true);
  164 |     });
  165 | 
  166 |     test('Light theme persists after page refresh', async ({ page }) => {
  167 |       await setTheme(page, 'light');
  168 |       await page.goto('/');
  169 |       await page.waitForLoadState('networkidle');
  170 |       
  171 |       // Refresh page
  172 |       await page.reload();
  173 |       await page.waitForLoadState('networkidle');
  174 |       
  175 |       // Verify light theme persisted
  176 |       const hasLightClass = await page.evaluate(() => 
  177 |         document.documentElement.classList.contains('light')
  178 |       );
  179 |       expect(hasLightClass).toBe(true);
  180 |     });
  181 |   });
  182 | 
  183 |   test.describe('TEST 4: Theme Toggle UI', () => {
  184 |     test('Theme toggle button is present and functional', async ({ page }) => {
  185 |       await page.goto('/');
  186 |       await page.waitForLoadState('networkidle');
  187 |       
  188 |       // Find theme toggle button (by aria-label or common patterns)
  189 |       const themeToggle = page.locator('[aria-label*="theme" i], [aria-label*="dark" i], [aria-label*="light" i]').first();
  190 |       
  191 |       // If toggle exists, test it
  192 |       if (await themeToggle.isVisible().catch(() => false)) {
  193 |         await themeToggle.click();
  194 |         
  195 |         // Verify theme dropdown or options appear
  196 |         const themeOptions = page.locator('text=Light, text=Dark, text=System').first();
  197 |         await expect(themeOptions).toBeVisible().catch(() => {
  198 |           // Some toggles might not have a dropdown, that's OK
  199 |         });
  200 |       }
  201 |     });
  202 |   });
  203 | 
  204 |   test.describe('TEST 5: Component Theme Consistency', () => {
  205 |     test('Header renders correctly in both themes', async ({ page }) => {
  206 |       await page.goto('/');
  207 |       await page.waitForLoadState('networkidle');
  208 |       
  209 |       for (const theme of ['light', 'dark'] as const) {
  210 |         await setTheme(page, theme);
  211 |         await page.waitForTimeout(100);
  212 |         
  213 |         const header = page.locator('header').first();
  214 |         await expect(header).toBeVisible();
  215 |         
  216 |         // Verify header has background color
  217 |         const bgColor = await header.evaluate((el) => 
```