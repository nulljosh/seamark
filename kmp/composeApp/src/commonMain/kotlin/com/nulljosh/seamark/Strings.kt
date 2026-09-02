package com.nulljosh.seamark

// ponytail: one map per language instead of resource bundles; the app has a dozen strings.
object Strings {
    private val en = mapOf(
        "clear" to "Clear", "parabola" to "Parabola", "exponential" to "Exponential", "sine" to "Sine",
        "hyperbola" to "Hyperbola", "circle" to "Circle", "arc" to "Arc",
        "measured" to "MEASURED FROM THE DRAWING", "hint" to "Draw a curve, or pick an example.",
        "samples" to "Samples", "xrange" to "x range", "yrange" to "y range", "roots" to "Crosses y=0 at",
        "branch" to "Branch", "family" to "Family", "circlefit" to "Circle fit",
        "never" to "never", "horizontal" to "horizontal", "vertical" to "vertical", "curved" to "slanted / curved",
        "none" to "none of the three", "notcircle" to "not a circle", "centre" to "centre",
        "linear" to "linear", "quadratic" to "quadratic", "exponentialf" to "exponential",
    )
    private val es = en + mapOf(
        "clear" to "Borrar", "parabola" to "Parábola", "exponential" to "Exponencial", "sine" to "Seno",
        "hyperbola" to "Hipérbola", "circle" to "Círculo", "arc" to "Arco",
        "measured" to "MEDIDO DEL DIBUJO", "hint" to "Dibuja una curva o elige un ejemplo.",
        "samples" to "Muestras", "xrange" to "rango x", "yrange" to "rango y", "roots" to "Cruza y=0 en",
        "branch" to "Rama", "family" to "Familia", "circlefit" to "Ajuste circular",
        "never" to "nunca", "horizontal" to "horizontal", "vertical" to "vertical", "curved" to "inclinada / curva",
        "none" to "ninguna de las tres", "notcircle" to "no es un círculo", "centre" to "centro",
        "linear" to "lineal", "quadratic" to "cuadrática", "exponentialf" to "exponencial",
    )
    private val fr = en + mapOf(
        "clear" to "Effacer", "parabola" to "Parabole", "exponential" to "Exponentielle", "sine" to "Sinus",
        "hyperbola" to "Hyperbole", "circle" to "Cercle", "arc" to "Arc",
        "measured" to "MESURÉ SUR LE DESSIN", "hint" to "Dessinez une courbe ou choisissez un exemple.",
        "samples" to "Échantillons", "xrange" to "plage x", "yrange" to "plage y", "roots" to "Coupe y=0 en",
        "branch" to "Branche", "family" to "Famille", "circlefit" to "Cercle ajusté",
        "never" to "jamais", "horizontal" to "horizontale", "vertical" to "verticale", "curved" to "inclinée / courbe",
        "none" to "aucune des trois", "notcircle" to "pas un cercle", "centre" to "centre",
        "linear" to "linéaire", "quadratic" to "quadratique", "exponentialf" to "exponentielle",
    )
    private val de = en + mapOf(
        "clear" to "Löschen", "parabola" to "Parabel", "exponential" to "Exponential", "sine" to "Sinus",
        "hyperbola" to "Hyperbel", "circle" to "Kreis", "arc" to "Bogen",
        "measured" to "AUS DER ZEICHNUNG GEMESSEN", "hint" to "Zeichne eine Kurve oder wähle ein Beispiel.",
        "samples" to "Proben", "xrange" to "x-Bereich", "yrange" to "y-Bereich", "roots" to "Schneidet y=0 bei",
        "branch" to "Ast", "family" to "Familie", "circlefit" to "Kreisanpassung",
        "never" to "nie", "horizontal" to "waagrecht", "vertical" to "senkrecht", "curved" to "schräg / gekrümmt",
        "none" to "keine der drei", "notcircle" to "kein Kreis", "centre" to "Mitte",
        "linear" to "linear", "quadratic" to "quadratisch", "exponentialf" to "exponentiell",
    )
    private val ja = en + mapOf(
        "clear" to "消去", "parabola" to "放物線", "exponential" to "指数関数", "sine" to "正弦",
        "hyperbola" to "双曲線", "circle" to "円", "arc" to "弧",
        "measured" to "描画から計測", "hint" to "曲線を描くか、例を選んでください。",
        "samples" to "サンプル数", "xrange" to "x範囲", "yrange" to "y範囲", "roots" to "y=0との交点",
        "branch" to "枝", "family" to "種類", "circlefit" to "円の当てはめ",
        "never" to "なし", "horizontal" to "水平", "vertical" to "垂直", "curved" to "斜め / 曲線",
        "none" to "三種のいずれでもない", "notcircle" to "円ではない", "centre" to "中心",
        "linear" to "一次", "quadratic" to "二次", "exponentialf" to "指数",
    )
    private val zh = en + mapOf(
        "clear" to "清除", "parabola" to "抛物线", "exponential" to "指数", "sine" to "正弦",
        "hyperbola" to "双曲线", "circle" to "圆", "arc" to "弧",
        "measured" to "从图形中测得", "hint" to "画一条曲线，或选择一个示例。",
        "samples" to "采样数", "xrange" to "x 范围", "yrange" to "y 范围", "roots" to "与 y=0 交于",
        "branch" to "分支", "family" to "类型", "circlefit" to "圆拟合",
        "never" to "无", "horizontal" to "水平", "vertical" to "垂直", "curved" to "倾斜 / 弯曲",
        "none" to "三者皆非", "notcircle" to "不是圆", "centre" to "圆心",
        "linear" to "线性", "quadratic" to "二次", "exponentialf" to "指数",
    )
    private val all = mapOf("en" to en, "es" to es, "fr" to fr, "de" to de, "ja" to ja, "zh" to zh)
    var language: String = "en"
    operator fun get(key: String): String = (all[language] ?: en)[key] ?: en[key] ?: key
}
