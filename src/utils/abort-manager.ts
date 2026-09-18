export class AbortManager {
  private currentController: AbortController | null = null

  /**
   * 创建一个新的 AbortController，如果已存在则先中止旧的
   * @returns 新的 AbortController
   */
  createController(): AbortController {
    // 如果存在旧的 controller，先中止它
    if (this.currentController) {
      this.currentController.abort()
    }

    // 创建新的 controller
    const controller = new AbortController()
    this.currentController = controller
    return controller
  }

  /**
   * 中止所有正在进行的请求
   */
  abortAll(): void {
    if (this.currentController) {
      this.currentController.abort()
    }
  }

  isCurrent(controller: AbortController): boolean {
    return this.currentController === controller
  }

  complete(controller: AbortController): boolean {
    if (this.currentController !== controller) {
      return false
    }

    this.currentController = null
    return true
  }
}
