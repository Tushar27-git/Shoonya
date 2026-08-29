from typing import Dict, Any, Optional
from ..models.enums import AdvisoryType

ADVISORY_TEMPLATES: Dict[AdvisoryType, Dict[str, str]] = {
    AdvisoryType.FLOOD_RISING: {
        "EN": "EMERGENCY ALERT: Flood waters are rising rapidly in {location}. Move immediately to upper floors or rooftop. Do not attempt to walk or drive through flowing water. Emergency teams are monitoring your zone.",
        "HI": "आपातकालीन चेतावनी: {location} में बाढ़ का पानी तेजी से बढ़ रहा है। तुरंत ऊपरी मंजिल या छत पर चले जाएं। बहते पानी में चलने या वाहन चलाने का प्रयास न करें। आपदा प्रबंधन दल निगरानी कर रहा है।",
        "HINGLISH": "EMERGENCY ALERT: {location} mein flood water tezi se badh raha hai. Turant upper floors ya chhat par safe ho jayein. Paani mein chalne ya gaadi chalane ki koshish na karein. Rescue team monitor kar rahi hai."
    },
    AdvisoryType.BOAT_INBOUND: {
        "EN": "RESCUE DISPATCH: Relief/Rescue Boat {resource_id} has been dispatched to {location}. Estimated Arrival Time: ~{eta_min} minutes. Stay at visible high ground with signaling devices (flashlights/bright cloth).",
        "HI": "राहत दल रवाना: राहत नाव {resource_id} {location} के लिए रवाना हो गई है। अनुमानित आगमन समय: लगभग {eta_min} मिनट। चमकीले कपड़े या टॉर्च के साथ सुरक्षित ऊंचाई पर रहें।",
        "HINGLISH": "RESCUE UPDATE: Relief Boat {resource_id} {location} ke liye dispatch ho chuki hai. Estimated Arrival: ~{eta_min} mins. Visible unchai par torch ya bright kapde ke sath signal karein."
    },
    AdvisoryType.EVACUATION_ORDER: {
        "EN": "MANDATORY EVACUATION: Immediate evacuation order in effect for {location}. Proceed calmly along designated high-ground routes to the nearest operational relief center at {shelter}.",
        "HI": "अनिवार्य निकासी आदेश: {location} के लिए तत्काल निकासी आदेश प्रभावी है। कृपया शांतिपूर्वक सुरक्षित ऊंचे मार्गों से होते हुए {shelter} स्थित निकटतम राहत केंद्र पर पहुंचे।",
        "HINGLISH": "MANDATORY EVACUATION: {location} ke liye tatkal evacuation order jari hua hai. Safe high-ground routes use karke nearest relief center {shelter} pahuchein."
    },
    AdvisoryType.WATER_CONTAMINATION: {
        "EN": "CRITICAL HEALTH WARNING: Ground tap water in {location} is severely contaminated by flood backflow. DO NOT DRINK untreated tap water. Use sealed bottled water or chlorinated water distributed at {shelter}.",
        "HI": "गंभीर स्वास्थ्य चेतावनी: {location} में नल का भूजल बाढ़ के कारण अत्यधिक दूषित हो चुका है। नल का कच्चा पानी बिल्कुल न पिएं। केवल {shelter} पर वितरित बोतलबंद या क्लोरीनयुक्त पानी पिएं।",
        "HINGLISH": "HEALTH WARNING: {location} mein tap water flood ke chalte contaminate ho chuka hai. Direct tap water bilkul mat piyein. {shelter} par distributed packaged/chlorine water hi use karein."
    },
    AdvisoryType.SHELTER_AVAILABLE: {
        "EN": "RELIEF CENTER OPEN: Emergency shelter and medical post at {shelter} ({location}) has open capacity with dry food, clean drinking water, and first aid supplies.",
        "HI": "राहत केंद्र उपलब्ध: {shelter} ({location}) पर आपातकालीन आश्रय और चिकित्सा केंद्र सक्रिय है, जहां सूखा भोजन, स्वच्छ पेयजल और प्राथमिक उपचार उपलब्ध है।",
        "HINGLISH": "RELIEF CENTER OPEN: {shelter} ({location}) par emergency shelter open hai jahan dry food, clean water aur first aid available hai."
    },
    AdvisoryType.GENERAL_ALERT: {
        "EN": "CRISIS UPDATE: EOC Command update for {location}. Stay indoors, keep mobile phones charged on battery-saver mode, and tune to official disaster broadcast frequencies.",
        "HI": "आपदा सूचना: {location} के लिए ईओसी निर्देश। घरों/सुरक्षित इमारतों में रहें, फोन को बैटरी-सेवर मोड में रखें और आधिकारिक प्रसारण सुनें।",
        "HINGLISH": "CRISIS UPDATE: {location} ke liye EOC alert. Indoors rahein, mobile battery save karein aur official channels par update dekhein."
    }
}

class AdvisoryTemplateEngine:
    """
    Renders structured, verified multi-lingual micro-guidance for civilians and ward residents.
    Adheres strictly to Anti-AI-slop clarity and factual safety standards.
    """
    @staticmethod
    def render_advisory(
        advisory_type: AdvisoryType,
        location_str: str = "Affected Zone",
        resource_id: Optional[str] = "RESCUE-01",
        eta_min: int = 15,
        shelter_str: str = "Designated Municipal Relief Camp",
        custom_en: Optional[str] = None,
        custom_hi: Optional[str] = None,
        custom_hinglish: Optional[str] = None
    ) -> Dict[str, str]:
        templates = ADVISORY_TEMPLATES.get(advisory_type, ADVISORY_TEMPLATES[AdvisoryType.GENERAL_ALERT])
        
        ctx = {
            "location": location_str,
            "resource_id": resource_id or "RESCUE-01",
            "eta_min": eta_min,
            "shelter": shelter_str
        }
        
        text_en = custom_en or templates["EN"].format(**ctx)
        text_hi = custom_hi or templates["HI"].format(**ctx)
        text_hinglish = custom_hinglish or templates["HINGLISH"].format(**ctx)
        
        return {
            "EN": text_en,
            "HI": text_hi,
            "HINGLISH": text_hinglish
        }
