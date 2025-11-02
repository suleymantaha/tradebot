import numpy as np


def check_matmul():
    A = np.asarray([[1, 2, 3], [4, 5, 6]], dtype=np.float64)
    B = np.asarray([[7, 8], [9, 10], [11, 12]], dtype=np.float64)
    print("A shape:", A.shape, "dtype:", A.dtype)
    print("B shape:", B.shape, "dtype:", B.dtype)
    C = A @ B
    print("C shape:", C.shape, "dtype:", C.dtype)
    print("C:\n", C)


def check_broadcast():
    x = np.arange(5, dtype=np.float64)
    y = np.array([10.0], dtype=np.float64)
    print("broadcast result:", x + y)


def check_finite():
    arr = np.array([1.0, float("nan"), 2.0, float("inf")])
    print("isfinite:", np.isfinite(arr))
    print("clean:", arr[np.isfinite(arr)])


if __name__ == "__main__":
    print("NumPy version:", np.__version__)
    check_matmul()
    check_broadcast()
    check_finite()
