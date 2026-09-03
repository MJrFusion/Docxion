package com.mjrfusion.docxion.ui

import android.animation.ValueAnimator
import android.annotation.SuppressLint
import android.content.Context
import android.view.GestureDetector
import android.view.MotionEvent
import android.view.ScaleGestureDetector
import android.view.animation.DecelerateInterpolator
import android.webkit.WebSettings
import android.webkit.WebView
import androidx.webkit.WebViewAssetLoader
import com.mjrfusion.docxion.bridge.DocxionJsBridge
import com.mjrfusion.docxion.bridge.DocxionWebViewApi
import com.mjrfusion.docxion.bridge.impl.DocxionJsBridgeImpl
import com.mjrfusion.docxion.bridge.impl.DocxionWebViewApiImpl
import com.mjrfusion.docxion.callback.DocxionCallbacks
import com.mjrfusion.docxion.client.DocxionFilePathHandler
import com.mjrfusion.docxion.client.DocxionWebViewClient
import timber.log.Timber
import java.io.File
import kotlin.math.abs

/**
 * WebView container for the Docxion JavaScript viewer.
 *
 * Configures the WebView, exposes the Android callback bridge to
 * JavaScript, and provides access to bundled Docxion assets and
 * registered local document files.
 *
 * The public Kotlin viewer operations are provided separately by
 * [com.mjrfusion.docxion.bridge.DocxionWebViewApi].
 */
@SuppressLint("SetJavaScriptEnabled")
class DocxionWebView(context: Context) : WebView(context) {

    companion object {
        private const val MIN_ZOOM = 0.24
        private const val FIT_ZOOM = 0.25
        private const val MAX_ZOOM = 3.0
        private const val DOUBLE_TAP_ZOOM_FACTOR = 2.0
        private const val ZOOM_EPSILON = 0.001
        private const val SCALE_EPSILON = 0.001
        private const val ZOOM_ANIMATION_DURATION = 120L
    }

    var webApi: DocxionWebViewApi
    private var bridge: DocxionJsBridge? = null
    private val filePathHandler = DocxionFilePathHandler()
    private val assetLoader = WebViewAssetLoader.Builder()
        .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(context))
        .addPathHandler("/docxion-file/", filePathHandler)
        .build()
    private val temporaryFiles = mutableSetOf<File>()

    private var zoomAnimator: ValueAnimator? = null
    private var scaling = false
    private var currentZoom = FIT_ZOOM
    private var targetZoom = FIT_ZOOM

    private fun animateZoom(from: Double, to: Double) {
        val start = from.coerceIn(MIN_ZOOM, MAX_ZOOM)
        val end = to.coerceIn(MIN_ZOOM, MAX_ZOOM)

        zoomAnimator?.cancel()

        if (abs(end - start) <= ZOOM_EPSILON) {
            currentZoom = end
            targetZoom = end
            webApi.setZoom(end)
            return
        }

        currentZoom = start
        targetZoom = end

        zoomAnimator = ValueAnimator.ofFloat(start.toFloat(), end.toFloat()).apply {
            duration = ZOOM_ANIMATION_DURATION
            interpolator = DecelerateInterpolator()

            addUpdateListener {
                currentZoom = (it.animatedValue as Float).toDouble()
                webApi.setZoom(currentZoom)
            }

            start()
        }
    }

    private fun startPinchAnimation() {
        zoomAnimator?.cancel()

        zoomAnimator = ValueAnimator.ofFloat(0f, 1f).apply {
            duration = ZOOM_ANIMATION_DURATION
            repeatCount = ValueAnimator.INFINITE
            interpolator = DecelerateInterpolator()

            addUpdateListener {
                val difference = targetZoom - currentZoom

                if (abs(difference) <= ZOOM_EPSILON) {
                    return@addUpdateListener
                }

                currentZoom = (currentZoom + difference * 0.35)
                    .coerceIn(MIN_ZOOM, MAX_ZOOM)

                webApi.setZoom(currentZoom)
            }

            start()
        }
    }

    private val scaleGestureDetector = ScaleGestureDetector(
        context,
        object : ScaleGestureDetector.SimpleOnScaleGestureListener() {
            override fun onScaleBegin(detector: ScaleGestureDetector): Boolean {
                scaling = true
                zoomAnimator?.cancel()

                webApi.getZoom { zoom ->
                    currentZoom = zoom.coerceIn(MIN_ZOOM, MAX_ZOOM)
                    targetZoom = currentZoom
                    startPinchAnimation()
                }

                return true
            }

            override fun onScale(detector: ScaleGestureDetector): Boolean {
                val scaleFactor = detector.scaleFactor.toDouble()

                if (!scaleFactor.isFinite() || scaleFactor <= 0.0) {
                    return true
                }

                val delta = scaleFactor - 1.0

                if (abs(delta) <= SCALE_EPSILON) {
                    return true
                }

                targetZoom = (targetZoom + delta).coerceIn(MIN_ZOOM, MAX_ZOOM)

                return true
            }

            override fun onScaleEnd(detector: ScaleGestureDetector) {
                scaling = false
                zoomAnimator?.cancel()
                zoomAnimator = null

                webApi.getZoom { zoom ->
                    currentZoom = zoom.coerceIn(MIN_ZOOM, MAX_ZOOM)
                    targetZoom = currentZoom
                }
            }
        }
    )

    private val gestureDetector = GestureDetector(
        context,
        object : GestureDetector.SimpleOnGestureListener() {
            override fun onDown(event: MotionEvent): Boolean {
                return true
            }

            override fun onDoubleTap(event: MotionEvent): Boolean {
                if (scaling) {
                    return true
                }

                zoomAnimator?.cancel()
                zoomAnimator = null

                webApi.getZoom { zoom ->
                    currentZoom = zoom.coerceIn(MIN_ZOOM, MAX_ZOOM)

                    if (currentZoom <= FIT_ZOOM + ZOOM_EPSILON) {
                        val zoomTarget = (currentZoom * DOUBLE_TAP_ZOOM_FACTOR)
                            .coerceIn(MIN_ZOOM, MAX_ZOOM)

                        targetZoom = zoomTarget
                        animateZoom(currentZoom, zoomTarget)

                        Timber.d(
                            "Double tap zoom: $currentZoom -> $zoomTarget at (${event.x}, ${event.y})"
                        )
                    } else {
                        webApi.fitToWidth()

                        webApi.getZoom { fitZoom ->
                            currentZoom = fitZoom.coerceIn(MIN_ZOOM, MAX_ZOOM)
                            targetZoom = currentZoom
                        }

                        Timber.d(
                            "Double tap reset zoom at (${event.x}, ${event.y})"
                        )
                    }
                }

                return true
            }
        }
    )

    init {
        settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mediaPlaybackRequiresUserGesture = false
            builtInZoomControls = false
            displayZoomControls = false
        }

        webViewClient = DocxionWebViewClient(assetLoader)
        webApi = DocxionWebViewApiImpl(this)
    }

    @SuppressLint("ClickableViewAccessibility")
    override fun onTouchEvent(event: MotionEvent): Boolean {
        val scaleHandled = scaleGestureDetector.onTouchEvent(event)
        val gestureHandled = gestureDetector.onTouchEvent(event)
        val webViewHandled = super.onTouchEvent(event)

        return scaleHandled || gestureHandled || webViewHandled
    }

    /**
     * Logs WebView size changes for debugging.
     */
    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        Timber.d("WebView size: ${w}x${h}")
    }

    /**
     * Installs the Android callback bridge exposed to JavaScript as
     * `window.DocxionAndroid`.
     *
     * Replaces any previously installed bridge.
     *
     * @param callbacks callback implementation receiving viewer events
     */
    fun setCallbacks(callbacks: DocxionCallbacks) {
        bridge?.let {
            removeJavascriptInterface("DocxionAndroid")
        }

        bridge = DocxionJsBridgeImpl(callbacks)
        addJavascriptInterface(bridge!!, "DocxionAndroid")
    }

    /**
     * Registers a local document for access by the JavaScript viewer.
     *
     * @param filePath absolute filesystem path
     * @return token used to construct the document resource URL
     */
    fun registerFile(filePath: String): String {
        return filePathHandler.register(filePath)
    }

    /**
     * Loads the bundled Docxion HTML application.
     */
    fun loadDocxion() {
        loadUrl("https://appassets.androidplatform.net/assets/docxion/index.html")
    }

    /**
     * Stops and destroys the Docxion WebView.
     *
     * Removes the JavaScript bridge, clears registered files,
     * deletes tracked temporary files, and destroys the WebView.
     */
    fun destroyDocxion() {
        zoomAnimator?.cancel()
        zoomAnimator = null
        bridge = null

        removeJavascriptInterface("DocxionAndroid")

        stopLoading()
        loadUrl("about:blank")

        clearHistory()
        removeAllViews()

        temporaryFiles.forEach(File::delete)
        temporaryFiles.clear()

        filePathHandler.clear()

        destroy()
    }
}