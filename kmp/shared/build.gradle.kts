plugins {
    alias(libs.plugins.kotlinMultiplatform)
    alias(libs.plugins.androidLibrary)
}

kotlin {
    jvm()
    androidTarget()
    sourceSets {
        commonTest.dependencies { implementation(kotlin("test")) }
    }
}

android {
    namespace = "com.nulljosh.seamark.shared"
    compileSdk = 36
    defaultConfig { minSdk = 26 }
}
